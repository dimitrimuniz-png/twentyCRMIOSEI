import { Module } from '@nestjs/common';

import { AppBillingController } from 'src/engine/core-modules/billing/app-billing/app-billing.controller';
import { AppBillingService } from 'src/engine/core-modules/billing/app-billing/app-billing.service';
import { BillingModule } from 'src/engine/core-modules/billing/billing.module';
import { TokenModule } from 'src/engine/core-modules/auth/token/token.module';
import { UsageLimitModule } from 'src/engine/core-modules/usage-limit/usage-limit.module';
import { WorkspaceCacheStorageModule } from 'src/engine/workspace-cache-storage/workspace-cache-storage.module';

@Module({
  imports: [
    BillingModule,
    TokenModule,
    UsageLimitModule,
    WorkspaceCacheStorageModule,
  ],
  controllers: [AppBillingController],
  providers: [AppBillingService],
  exports: [AppBillingService],
})
export class AppBillingModule {}
