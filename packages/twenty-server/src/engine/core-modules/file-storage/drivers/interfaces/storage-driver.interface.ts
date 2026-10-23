import { type Readable } from 'stream';

import { type ByteRange } from 'src/engine/core-modules/file-storage/types/byte-range.type';
import { type FileStorageMetadata } from 'src/engine/core-modules/file-storage/types/file-storage-metadata.type';

export interface StorageDriver {
  readFile(params: {
    filePath: string;
    byteRange?: ByteRange;
  }): Promise<Readable>;
  readFilePrefix(params: {
    filePath: string;
    byteCount: number;
  }): Promise<Buffer>;
  writeFile(params: {
    filePath: string;
    sourceFile: Buffer | Uint8Array | string;
    mimeType: string | undefined;
  }): Promise<void>;

  writeFileStream(params: {
    filePath: string;
    stream: Readable;
    mimeType: string | undefined;
  }): Promise<void>;

  getFileMetadata(params: {
    filePath: string;
  }): Promise<FileStorageMetadata | null>;

  downloadFile(params: {
    onStoragePath: string;
    localPath: string;
  }): Promise<void>;

  delete(params: { folderPath: string; filename?: string }): Promise<void>;
  move(params: {
    from: { folderPath: string; filename?: string };
    to: { folderPath: string; filename?: string };
    ifMatchChecksum?: string;
  }): Promise<void>;
  copy(params: {
    from: { folderPath: string; filename?: string };
    to: { folderPath: string; filename?: string };
  }): Promise<void>;

  checkFileExists(params: { filePath: string }): Promise<boolean>;
  checkFolderExists(params: { folderPath: string }): Promise<boolean>;

  getPresignedUrl(params: {
    filePath: string;
    expiresInSeconds?: number;
    responseContentType?: string;
    responseContentDisposition?: string;
    responseCacheControl?: string;
  }): Promise<string | null>;

  // Signs a browser GET even when the global presign flag is off.
  // That flag also switches CRM uploads to presigned PUT.
  getPresignedDownloadUrl(params: {
    filePath: string;
    expiresInSeconds?: number;
    responseContentType?: string;
    responseContentDisposition?: string;
    responseCacheControl?: string;
  }): Promise<string | null>;

  getPresignedUploadUrl(params: {
    filePath: string;
    contentType: string;
    contentLength: number;
    expiresInSeconds?: number;
  }): Promise<string | null>;
}
