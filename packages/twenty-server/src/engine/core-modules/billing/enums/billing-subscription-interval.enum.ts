import { registerEnumType } from '@nestjs/graphql';

export enum SubscriptionInterval {
  Month = 'Month',
  Year = 'Year',
}

registerEnumType(SubscriptionInterval, { name: 'SubscriptionInterval' });
