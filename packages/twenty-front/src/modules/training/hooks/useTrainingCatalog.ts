import { isObject, isNonEmptyString } from '@sniptt/guards';
import { useEffect, useState } from 'react';
import { type TrainingCatalogDefinition } from 'twenty-shared/constants';

const isTrainingCatalog = (
  value: unknown,
): value is TrainingCatalogDefinition => {
  if (!isObject(value)) {
    return false;
  }

  const catalog = value as Record<string, unknown>;
  const manual = catalog.manual;

  if (!isObject(manual)) {
    return false;
  }

  const manualRecord = manual as Record<string, unknown>;

  return (
    isNonEmptyString(manualRecord.fileName) &&
    isNonEmptyString(manualRecord.title) &&
    Array.isArray(catalog.modules)
  );
};

export const useTrainingCatalog = () => {
  const [catalog, setCatalog] = useState<TrainingCatalogDefinition | null>(
    null,
  );
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadCatalog = async () => {
      try {
        const response = await fetch('/rest/training/catalog', {
          credentials: 'include',
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error('Training catalog request failed');
        }

        const body: unknown = await response.json();

        if (!isTrainingCatalog(body)) {
          throw new Error('Training catalog response is invalid');
        }

        if (!cancelled) {
          setCatalog(body);
        }
      } catch {
        if (!cancelled) {
          setHasError(true);
        }
      }
    };

    void loadCatalog();

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    catalog,
    hasError,
    isLoading: !catalog && !hasError,
  };
};
