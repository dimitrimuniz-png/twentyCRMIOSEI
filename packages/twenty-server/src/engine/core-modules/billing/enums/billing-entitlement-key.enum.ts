import { registerEnumType } from '@nestjs/graphql';

export enum BillingEntitlementKey {
  AUDIT_LOGS = 'AUDIT_LOGS',
  CUSTOM_DOMAIN = 'CUSTOM_DOMAIN',
  CUSTOM_ROLES = 'CUSTOM_ROLES',
  RECORD_SHARING = 'RECORD_SHARING',
  RLS = 'RLS',
  SSO = 'SSO',
  USAGE_LIMIT = 'USAGE_LIMIT',
  VALIDATION_RULES = 'VALIDATION_RULES',
}

registerEnumType(BillingEntitlementKey, { name: 'BillingEntitlementKey' });
