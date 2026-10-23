import { resolveTrainingStoragePrefix } from 'src/engine/core-modules/training/utils/resolve-training-storage-prefix.util';

describe('resolveTrainingStoragePrefix', () => {
  it('normalizes a safe prefix and adds a trailing slash', () => {
    expect(resolveTrainingStoragePrefix(' training/videos/ ')).toBe(
      'training/videos/',
    );
    expect(resolveTrainingStoragePrefix('/training')).toBe('training/');
  });

  it('falls back when the prefix could escape the storage root', () => {
    expect(resolveTrainingStoragePrefix('../training')).toBe('training/');
    expect(resolveTrainingStoragePrefix('')).toBe('training/');
    expect(resolveTrainingStoragePrefix('training/../secret')).toBe(
      'training/',
    );
  });
});
