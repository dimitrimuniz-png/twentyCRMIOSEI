import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { Readable } from 'stream';

import {
  DEFAULT_TRAINING_CATALOG,
  TRAINING_MANIFEST_FILE_NAME,
  type TrainingCatalogDefinition,
} from 'twenty-shared/constants';

import { type StorageDriver } from 'src/engine/core-modules/file-storage/drivers/interfaces/storage-driver.interface';
import { FileStorageDriverFactory } from 'src/engine/core-modules/file-storage/file-storage-driver.factory';
import {
  FileStorageException,
  FileStorageExceptionCode,
} from 'src/engine/core-modules/file-storage/interfaces/file-storage-exception';
import { StorageDriverType } from 'src/engine/core-modules/file-storage/interfaces/file-storage.interface';
import { resolveByteRange } from 'src/engine/core-modules/file/utils/resolve-byte-range.utils';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { parseTrainingManifest } from 'src/engine/core-modules/training/utils/parse-training-manifest.util';
import { resolveTrainingStoragePrefix } from 'src/engine/core-modules/training/utils/resolve-training-storage-prefix.util';
import {
  trainingMediaContentDisposition,
  trainingMediaContentType,
} from 'src/engine/core-modules/training/utils/training-media-content-type.util';

const TRAINING_DEFINITION_CACHE_MS = 30_000;
const TRAINING_MANIFEST_MAX_BYTES = 1_000_000;

export type TrainingMediaStream =
  | { type: 'unsatisfiable'; size: number }
  | {
      type: 'full' | 'partial';
      stream: Readable;
      mimeType: string;
      contentDisposition: string;
      size: number;
      startByte: number;
      endByte: number;
      contentLength: number;
    };

const readBoundedUtf8 = async (
  stream: Readable,
  maxBytes: number,
): Promise<string> => {
  const chunks: Buffer[] = [];
  let totalBytes = 0;

  try {
    for await (const chunk of stream) {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      totalBytes += buffer.length;

      if (totalBytes > maxBytes) {
        throw new Error('Training manifest exceeds the size limit');
      }

      chunks.push(buffer);
    }
  } finally {
    stream.destroy();
  }

  return Buffer.concat(chunks).toString('utf8');
};

@Injectable()
export class TrainingService {
  private readonly logger = new Logger(TrainingService.name);
  private cachedDefinition: {
    expiresAt: number;
    definition: TrainingCatalogDefinition;
  } | null = null;

  constructor(
    private readonly fileStorageDriverFactory: FileStorageDriverFactory,
    private readonly twentyConfigService: TwentyConfigService,
  ) {}

  async getCatalog(): Promise<TrainingCatalogDefinition> {
    return this.getDefinition();
  }

  async getPlaybackUrl(fileName: string): Promise<string> {
    const storageKey = await this.storageKeyForAllowedFile(fileName);
    const presignedUrl = await this.presignDownload(storageKey, fileName);

    if (presignedUrl) {
      return presignedUrl;
    }

    return `/rest/training/media/${encodeURIComponent(fileName)}`;
  }

  async openMedia({
    fileName,
    rangeHeader,
  }: {
    fileName: string;
    rangeHeader: string | undefined;
  }): Promise<{ type: 'redirect'; url: string } | TrainingMediaStream> {
    const storageKey = await this.storageKeyForAllowedFile(fileName);
    const presignedUrl = await this.presignDownload(storageKey, fileName);

    if (presignedUrl) {
      return { type: 'redirect', url: presignedUrl };
    }

    return this.openStoredStream({ fileName, storageKey, rangeHeader });
  }

  private driver(): StorageDriver {
    return this.fileStorageDriverFactory.getCurrentDriver();
  }

  private storagePrefix(): string {
    return resolveTrainingStoragePrefix(
      this.twentyConfigService.get('TRAINING_STORAGE_PREFIX'),
    );
  }

  private async getDefinition(): Promise<TrainingCatalogDefinition> {
    const now = Date.now();

    if (this.cachedDefinition && this.cachedDefinition.expiresAt > now) {
      return this.cachedDefinition.definition;
    }

    const definition = await this.loadDefinition();

    this.cachedDefinition = {
      expiresAt: now + TRAINING_DEFINITION_CACHE_MS,
      definition,
    };

    return definition;
  }

  private async loadDefinition(): Promise<TrainingCatalogDefinition> {
    const manifestKey = `${this.storagePrefix()}${TRAINING_MANIFEST_FILE_NAME}`;

    try {
      const stream = await this.driver().readFile({ filePath: manifestKey });
      const rawManifest = await readBoundedUtf8(
        stream,
        TRAINING_MANIFEST_MAX_BYTES,
      );
      const manifest = parseTrainingManifest(rawManifest);

      if (!manifest) {
        this.logger.warn(
          'Training manifest is invalid. Using the built-in catalog.',
        );

        return DEFAULT_TRAINING_CATALOG;
      }

      return manifest;
    } catch (error) {
      if (
        error instanceof FileStorageException &&
        error.code === FileStorageExceptionCode.FILE_NOT_FOUND
      ) {
        return DEFAULT_TRAINING_CATALOG;
      }

      this.logger.warn(
        `Training manifest could not be read. Using the built-in catalog. ${
          error instanceof Error ? error.message : String(error)
        }`,
      );

      return DEFAULT_TRAINING_CATALOG;
    }
  }

  private async storageKeyForAllowedFile(fileName: string): Promise<string> {
    const definition = await this.getDefinition();
    const allowedFileNames = new Set<string>([
      definition.manual.fileName,
      ...definition.modules.map((module) => module.fileName),
    ]);

    if (!allowedFileNames.has(fileName)) {
      throw new NotFoundException('Training file not found');
    }

    return `${this.storagePrefix()}${fileName}`;
  }

  private async presignDownload(
    storageKey: string,
    fileName: string,
  ): Promise<string | null> {
    if (
      this.twentyConfigService.get('STORAGE_TYPE') !== StorageDriverType.S_3
    ) {
      return null;
    }

    return this.driver().getPresignedDownloadUrl({
      filePath: storageKey,
      expiresInSeconds: this.twentyConfigService.get(
        'STORAGE_S3_PRESIGNED_URL_EXPIRES_IN',
      ),
      responseContentType: trainingMediaContentType(fileName),
      responseContentDisposition: trainingMediaContentDisposition(fileName),
      responseCacheControl: 'private, max-age=900',
    });
  }

  private async openStoredStream({
    fileName,
    storageKey,
    rangeHeader,
  }: {
    fileName: string;
    storageKey: string;
    rangeHeader: string | undefined;
  }): Promise<TrainingMediaStream> {
    const metadata = await this.driver().getFileMetadata({
      filePath: storageKey,
    });

    if (!metadata) {
      throw new NotFoundException('Training file not found');
    }

    const mimeType = trainingMediaContentType(fileName);
    const contentDisposition = trainingMediaContentDisposition(fileName);

    if (metadata.size === 0) {
      return {
        type: 'full',
        stream: await this.driver().readFile({ filePath: storageKey }),
        mimeType,
        contentDisposition,
        size: 0,
        startByte: 0,
        endByte: 0,
        contentLength: 0,
      };
    }

    const resolvedRange = resolveByteRange({
      rangeHeader,
      fileSizeInBytes: metadata.size,
    });

    if (resolvedRange.type === 'unsatisfiable') {
      return { type: 'unsatisfiable', size: metadata.size };
    }

    const byteRange =
      resolvedRange.type === 'partial' ? resolvedRange.byteRange : undefined;
    const startByte = byteRange?.startByte ?? 0;
    const endByte = byteRange?.endByte ?? metadata.size - 1;

    return {
      type: resolvedRange.type,
      stream: await this.driver().readFile({
        filePath: storageKey,
        byteRange,
      }),
      mimeType,
      contentDisposition,
      size: metadata.size,
      startByte,
      endByte,
      contentLength: endByte - startByte + 1,
    };
  }
}
