import { DEFAULT_TRAINING_CATALOG } from 'twenty-shared/constants';

import { parseTrainingManifest } from 'src/engine/core-modules/training/utils/parse-training-manifest.util';

const validManifest = () => ({
  manual: {
    fileName: 'manual-custom.pdf',
    title: 'Manual atualizado',
  },
  modules: [
    {
      order: 2,
      fileName: '02-outro.mp4',
      title: 'Segundo',
      description: 'Descrição do segundo módulo.',
    },
    {
      order: 1,
      fileName: '01-primeiro.mp4',
      title: 'Primeiro',
      description: 'Descrição do primeiro módulo.',
    },
  ],
});

describe('parseTrainingManifest', () => {
  it('sorts modules and keeps a valid override', () => {
    const catalog = parseTrainingManifest(JSON.stringify(validManifest()));

    expect(catalog?.modules.map((module) => module.fileName)).toEqual([
      '01-primeiro.mp4',
      '02-outro.mp4',
    ]);
    expect(catalog?.manual.title).toBe('Manual atualizado');
  });

  it('rejects path traversal and duplicate files', () => {
    const traversal = validManifest();
    traversal.modules[0].fileName = '../secret.mp4';

    expect(parseTrainingManifest(JSON.stringify(traversal))).toBeNull();

    const duplicate = validManifest();
    duplicate.modules[1].fileName = duplicate.modules[0].fileName;

    expect(parseTrainingManifest(JSON.stringify(duplicate))).toBeNull();
    expect(parseTrainingManifest('{')).toBeNull();
  });

  it('keeps the built-in catalog shape available as the fallback source', () => {
    expect(DEFAULT_TRAINING_CATALOG.modules).toHaveLength(9);
    expect(DEFAULT_TRAINING_CATALOG.modules[0].fileName).toBe(
      '01-visao-geral.mp4',
    );
    expect(DEFAULT_TRAINING_CATALOG.manual.fileName).toBe(
      'manual-crm-iosei.pdf',
    );
  });
});
