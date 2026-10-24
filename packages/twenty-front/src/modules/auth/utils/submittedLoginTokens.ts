// The approval gate remounts /verify after the session cookie is set.
// A ref on that page does not survive the remount, and the token is single-use.
const submittedLoginTokens = new Set<string>();

export const hasSubmittedLoginToken = (loginToken: string): boolean =>
  submittedLoginTokens.has(loginToken);

export const markLoginTokenSubmitted = (loginToken: string): void => {
  submittedLoginTokens.add(loginToken);
};

export const clearSubmittedLoginTokens = (): void => {
  submittedLoginTokens.clear();
};
