import { useRef, useState } from 'react';

import { TrainingPageContent } from '@/training/components/TrainingPageContent';
import { useTrainingCatalog } from '@/training/hooks/useTrainingCatalog';
import { fetchTrainingMediaUrl } from '@/training/utils/fetchTrainingMediaUrl';

export const TrainingPage = () => {
  const { catalog, hasError, isLoading } = useTrainingCatalog();
  const [activeFileName, setActiveFileName] = useState<string | null>(null);
  const [activeMediaUrl, setActiveMediaUrl] = useState<string | null>(null);
  const [isMediaLoading, setIsMediaLoading] = useState(false);
  const [hasMediaError, setHasMediaError] = useState(false);
  // Ignores a media response after a newer click, without an extra render.
  // oxlint-disable-next-line twenty/no-state-useref
  const requestIdRef = useRef(0);

  const handleSelectModule = async (fileName: string) => {
    if (fileName === activeFileName) {
      requestIdRef.current += 1;
      setActiveFileName(null);
      setActiveMediaUrl(null);
      setIsMediaLoading(false);
      setHasMediaError(false);

      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setActiveFileName(fileName);
    setActiveMediaUrl(null);
    setHasMediaError(false);
    setIsMediaLoading(true);

    try {
      const url = await fetchTrainingMediaUrl(fileName);

      if (requestIdRef.current !== requestId) {
        return;
      }

      setActiveMediaUrl(url);
    } catch {
      if (requestIdRef.current !== requestId) {
        return;
      }

      setHasMediaError(true);
    } finally {
      if (requestIdRef.current === requestId) {
        setIsMediaLoading(false);
      }
    }
  };

  return (
    <TrainingPageContent
      catalog={catalog}
      isLoading={isLoading}
      hasError={hasError}
      activeFileName={activeFileName}
      activeMediaUrl={activeMediaUrl}
      isMediaLoading={isMediaLoading}
      hasMediaError={hasMediaError}
      onSelectModule={(fileName) => {
        void handleSelectModule(fileName);
      }}
      onVideoError={() => setHasMediaError(true)}
    />
  );
};
