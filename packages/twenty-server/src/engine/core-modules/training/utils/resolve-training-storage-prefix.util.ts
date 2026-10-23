const TRAINING_STORAGE_PREFIX_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9/_-]{0,200}$/;

const DEFAULT_TRAINING_STORAGE_PREFIX = 'training/';

export const resolveTrainingStoragePrefix = (rawPrefix: string): string => {
  const trimmed = rawPrefix.trim().replace(/^\/+/, '').replace(/\/+$/, '');

  if (
    trimmed.length === 0 ||
    trimmed.split('/').includes('..') ||
    !TRAINING_STORAGE_PREFIX_PATTERN.test(trimmed)
  ) {
    return DEFAULT_TRAINING_STORAGE_PREFIX;
  }

  return `${trimmed}/`;
};
