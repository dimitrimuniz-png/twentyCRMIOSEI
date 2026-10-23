import { isNonEmptyString, isObject } from '@sniptt/guards';
import { doNotTranslate } from 'twenty-shared/i18n';

export const fetchTrainingMediaUrl = async (
  fileName: string,
): Promise<string> => {
  const response = await fetch(
    `/rest/training/media-url/${encodeURIComponent(fileName)}`,
    { credentials: 'include', cache: 'no-store' },
  );

  if (!response.ok) {
    throw new Error(doNotTranslate('Training media URL request failed'));
  }

  const body: unknown = await response.json();

  if (!isObject(body)) {
    throw new Error(doNotTranslate('Training media URL response is invalid'));
  }

  const url = (body as Record<string, unknown>).url;

  if (!isNonEmptyString(url)) {
    throw new Error(doNotTranslate('Training media URL is missing'));
  }

  return url;
};
