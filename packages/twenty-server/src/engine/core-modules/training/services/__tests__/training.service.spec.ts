import { NotFoundException } from '@nestjs/common';

import { Readable } from 'stream';

import { DEFAULT_TRAINING_CATALOG } from 'twenty-shared/constants';

import { FileStorageDriverFactory } from 'src/engine/core-modules/file-storage/file-storage-driver.factory';
import {
  FileStorageException,
  FileStorageExceptionCode,
} from 'src/engine/core-modules/file-storage/interfaces/file-storage-exception';
import { StorageDriverType } from 'src/engine/core-modules/file-storage/interfaces/file-storage.interface';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { TrainingService } from 'src/engine/core-modules/training/services/training.service';

const configValues: Record<string, string | number> = {
  TRAINING_STORAGE_PREFIX: 'training',
  STORAGE_TYPE: StorageDriverType.LOCAL,
  STORAGE_S3_PRESIGNED_URL_EXPIRES_IN: 900,
};

const createService = (
  driver: {
    readFile: jest.Mock;
    getPresignedDownloadUrl: jest.Mock;
    getFileMetadata: jest.Mock;
  },
  overrides: Record<string, string | number> = {},
) => {
  const values = { ...configValues, ...overrides };
  const twentyConfigService = {
    get: jest.fn((key: string) => values[key]),
  } as unknown as TwentyConfigService;
  const fileStorageDriverFactory = {
    getCurrentDriver: jest.fn(() => driver),
  } as unknown as FileStorageDriverFactory;

  return new TrainingService(fileStorageDriverFactory, twentyConfigService);
};

describe('TrainingService', () => {
  const driver = {
    readFile: jest.fn(),
    getPresignedDownloadUrl: jest.fn(),
    getFileMetadata: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    driver.readFile.mockRejectedValue(
      new FileStorageException(
        'File not found',
        FileStorageExceptionCode.FILE_NOT_FOUND,
      ),
    );
    driver.getPresignedDownloadUrl.mockResolvedValue(null);
  });

  it('uses the built-in catalog and a same-origin media path on local storage', async () => {
    const service = createService(driver);

    await expect(service.getCatalog()).resolves.toEqual(
      DEFAULT_TRAINING_CATALOG,
    );
    await expect(service.getPlaybackUrl('01-visao-geral.mp4')).resolves.toBe(
      '/rest/training/media/01-visao-geral.mp4',
    );
    expect(driver.getPresignedDownloadUrl).not.toHaveBeenCalled();
  });

  it('returns a presigned url when storage is S3', async () => {
    driver.getPresignedDownloadUrl.mockResolvedValue(
      'https://s3.example.com/training/01-visao-geral.mp4?signed=1',
    );
    const service = createService(driver, {
      STORAGE_TYPE: StorageDriverType.S_3,
    });

    await expect(service.getPlaybackUrl('01-visao-geral.mp4')).resolves.toBe(
      'https://s3.example.com/training/01-visao-geral.mp4?signed=1',
    );
    expect(driver.getPresignedDownloadUrl).toHaveBeenCalledWith(
      expect.objectContaining({
        filePath: 'training/01-visao-geral.mp4',
        responseContentType: 'video/mp4',
      }),
    );
  });

  it('applies a valid manifest stored next to the videos', async () => {
    driver.readFile.mockResolvedValue(
      Readable.from([
        Buffer.from(
          JSON.stringify({
            manual: {
              fileName: 'manual-custom.pdf',
              title: 'Manual novo',
            },
            modules: [
              {
                order: 1,
                fileName: '01-custom.mp4',
                title: 'Módulo novo',
                description: 'Descrição nova.',
              },
            ],
          }),
        ),
      ]),
    );
    const service = createService(driver);

    const catalog = await service.getCatalog();

    expect(catalog.modules).toEqual([
      {
        order: 1,
        fileName: '01-custom.mp4',
        title: 'Módulo novo',
        description: 'Descrição nova.',
      },
    ]);
    await expect(
      service.getPlaybackUrl('01-visao-geral.mp4'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('streams a byte range from local storage', async () => {
    driver.getFileMetadata.mockResolvedValue({ size: 1000 });
    driver.readFile.mockImplementation(
      async ({ filePath }: { filePath: string }) => {
        if (filePath.endsWith('manifest.json')) {
          throw new FileStorageException(
            'File not found',
            FileStorageExceptionCode.FILE_NOT_FOUND,
          );
        }

        return Readable.from([Buffer.from('partial')]);
      },
    );
    const service = createService(driver);

    const media = await service.openMedia({
      fileName: '01-visao-geral.mp4',
      rangeHeader: 'bytes=0-99',
    });

    expect(media).toEqual(
      expect.objectContaining({
        type: 'partial',
        startByte: 0,
        endByte: 99,
        contentLength: 100,
        size: 1000,
        mimeType: 'video/mp4',
      }),
    );
    expect(driver.readFile).toHaveBeenCalledWith({
      filePath: 'training/01-visao-geral.mp4',
      byteRange: { startByte: 0, endByte: 99 },
    });
  });
});
