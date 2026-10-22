export const isValidCreditAmountMicro = (amountMicro: number): boolean =>
  Number.isSafeInteger(amountMicro) && amountMicro >= 0;
