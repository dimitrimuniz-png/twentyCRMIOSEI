import { registerEnumType } from '@nestjs/graphql';

export enum BillingUsageType {
  LICENSED = 'LICENSED',
  METERED = 'METERED',
}

registerEnumType(BillingUsageType, { name: 'BillingUsageType' });
