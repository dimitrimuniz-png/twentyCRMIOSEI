import { Module } from '@nestjs/common';

import { StripeInvoiceService } from 'src/engine/core-modules/billing/stripe/services/stripe-invoice.service';

@Module({
  providers: [StripeInvoiceService],
  exports: [StripeInvoiceService],
})
export class StripeModule {}
