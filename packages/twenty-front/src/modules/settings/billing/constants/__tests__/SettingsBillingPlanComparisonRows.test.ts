import { SETTINGS_BILLING_PLAN_COMPARISON_ROWS } from '@/settings/billing/constants/SettingsBillingPlanComparisonRows';
import { BillingPlanKey } from '~/generated-metadata/graphql';

const featureRow = (label: string) => {
  const row = SETTINGS_BILLING_PLAN_COMPARISON_ROWS.find(
    (candidate) =>
      candidate.type === 'feature' && candidate.featureLabel.message === label,
  );

  if (row?.type !== 'feature') {
    throw new Error(`Missing comparison row ${label}`);
  }

  return row;
};

describe('SETTINGS_BILLING_PLAN_COMPARISON_ROWS', () => {
  it('includes SSO, row-level permissions, and audit logs on every plan', () => {
    for (const label of ['Row-level permissions', 'SSO', 'Audit logs']) {
      const row = featureRow(label);

      expect(row.plans[BillingPlanKey.PRO].kind).not.toBe('excluded');
      expect(row.plans[BillingPlanKey.PRO_V2].kind).not.toBe('excluded');
      expect(row.plans[BillingPlanKey.ENTERPRISE].kind).not.toBe('excluded');
      expect(row.plans[BillingPlanKey.ORGANIZATION_V2].kind).not.toBe(
        'excluded',
      );
    }
  });

  it('lists the same log retention on Pro and Organization', () => {
    const row = featureRow('Log retention');

    for (const planKey of [
      BillingPlanKey.PRO,
      BillingPlanKey.PRO_V2,
      BillingPlanKey.ENTERPRISE,
      BillingPlanKey.ORGANIZATION_V2,
    ]) {
      const cell = row.plans[planKey];

      expect(cell).toEqual({
        kind: 'text',
        text: expect.objectContaining({
          message: 'Custom, up to 3 years',
        }),
      });
    }
  });
});
