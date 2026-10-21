import { Module } from '@nestjs/common';

import { ApplicationRecurringChargeCronCommand } from 'src/engine/core-modules/billing/app-billing/crons/commands/application-recurring-charge.cron.command';

// The command is a no-op on this fork. It stays registered so cron:register:all
// can construct, and it is skipped unless IS_BILLING_ENABLED is set.
@Module({
  providers: [ApplicationRecurringChargeCronCommand],
  exports: [ApplicationRecurringChargeCronCommand],
})
export class ApplicationRecurringChargeModule {}
