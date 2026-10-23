import { isNonEmptyString, isObject } from '@sniptt/guards';

export const fetchTrainingMediaUrl = async (
  fileName: string,
): Promise<string> => {
  const response = await fetch(
    `/rest/training/media-url/${encodeURIComponent(fileName)}`,
    { credentials: 'include', cache: 'no-store' },
  );

  if (!response.ok) {
    throw new Error('Training media URL request failed');
  }

  const body: unknown = await response.json();

  if (!isObject(body)) {
    throw new Error('Training media URL response is invalid');
  }

  const url = (body as Record<string, unknown>).url;

  if (!isNonEmptyString(url)) {
    throw new Error('Training media URL is missing');
  }

  return url;
};
