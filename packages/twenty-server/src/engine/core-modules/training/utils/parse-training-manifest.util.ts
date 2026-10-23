import { isNonEmptyString, isObject } from '@sniptt/guards';
import {
  type TrainingCatalogDefinition,
  type TrainingCatalogManual,
  type TrainingCatalogModule,
} from 'twenty-shared/constants';

const TRAINING_FILE_NAME_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,200}$/;
const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 500;

const isSafeTrainingFileName = (fileName: string, extension: string): boolean =>
  TRAINING_FILE_NAME_PATTERN.test(fileName) &&
  fileName.toLowerCase().endsWith(`.${extension}`) &&
  !fileName.includes('/') &&
  !fileName.includes('\\');

const isModule = (value: unknown): value is TrainingCatalogModule => {
  if (!isObject(value)) {
    return false;
  }

  const module = value as Record<string, unknown>;

  return (
    typeof module.order === 'number' &&
    Number.isInteger(module.order) &&
    module.order > 0 &&
    isNonEmptyString(module.fileName) &&
    isSafeTrainingFileName(module.fileName, 'mp4') &&
    isNonEmptyString(module.title) &&
    module.title.length <= MAX_TITLE_LENGTH &&
    isNonEmptyString(module.description) &&
    module.description.length <= MAX_DESCRIPTION_LENGTH
  );
};

const isManual = (value: unknown): value is TrainingCatalogManual => {
  if (!isObject(value)) {
    return false;
  }

  const manual = value as Record<string, unknown>;

  return (
    isNonEmptyString(manual.fileName) &&
    isSafeTrainingFileName(manual.fileName, 'pdf') &&
    isNonEmptyString(manual.title) &&
    manual.title.length <= MAX_TITLE_LENGTH
  );
};

// A partial manifest would silently drop modules, so any invalid entry discards the file.
export const parseTrainingManifest = (
  rawManifest: string,
): TrainingCatalogDefinition | null => {
  let parsed: unknown;

  try {
    parsed = JSON.parse(rawManifest);
  } catch {
    return null;
  }

  if (!isObject(parsed)) {
    return null;
  }

  const record = parsed as Record<string, unknown>;
  const manual = record.manual;

  if (!isManual(manual)) {
    return null;
  }

  if (!Array.isArray(record.modules) || record.modules.length === 0) {
    return null;
  }

  const modules: TrainingCatalogModule[] = [];

  for (const entry of record.modules) {
    if (!isModule(entry)) {
      return null;
    }

    modules.push(entry);
  }

  modules.sort((left, right) => left.order - right.order);

  const fileNames = [
    manual.fileName,
    ...modules.map((module) => module.fileName),
  ];
  const orders = modules.map((module) => module.order);

  if (
    new Set(fileNames).size !== fileNames.length ||
    new Set(orders).size !== orders.length
  ) {
    return null;
  }

  return {
    manual: {
      fileName: manual.fileName,
      title: manual.title,
    },
    modules: modules.map((module) => ({
      order: module.order,
      fileName: module.fileName,
      title: module.title,
      description: module.description,
    })),
  };
};
