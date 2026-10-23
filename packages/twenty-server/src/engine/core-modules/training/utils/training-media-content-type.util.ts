export const trainingMediaContentType = (fileName: string): string => {
  if (fileName.toLowerCase().endsWith('.pdf')) {
    return 'application/pdf';
  }

  return 'video/mp4';
};

export const trainingMediaContentDisposition = (fileName: string): string =>
  `inline; filename="${fileName}"`;
