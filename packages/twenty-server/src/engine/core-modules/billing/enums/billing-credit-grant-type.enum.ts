import { registerEnumType } from '@nestjs/graphql';

export enum BillingCreditGrantType {
  COMPENSATION = 'COMPENSATION',
  ONBOARDING_REWARD = 'ONBOARDING_REWARD',
  PURCHASE = 'PURCHASE',
  ROLLOVER = 'ROLLOVER',
  SALES = 'SALES',
}

registerEnumType(BillingCreditGrantType, {
  name: 'BillingCreditGrantType',
});
