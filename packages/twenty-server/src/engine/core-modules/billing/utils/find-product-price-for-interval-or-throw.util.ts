import {
  BillingException,
  BillingExceptionCode,
} from 'src/engine/core-modules/billing/billing.exception';
import { type SubscriptionInterval } from 'src/engine/core-modules/billing/enums/billing-subscription-interval.enum';

type BillingPriceForInterval = {
  stripePriceId: string;
  interval: SubscriptionInterval;
  active: boolean;
  metadata?: {
    isLegacy?: string;
  };
};

// Billing stays inactive on this fork. The lookup only exists so price
// selection stays deterministic if a caller still has stored prices.
export const findProductPriceForIntervalOrThrow = <
  TPrice extends BillingPriceForInterval,
>(
  product: { billingPrices: TPrice[] },
  interval: SubscriptionInterval,
): TPrice => {
  const activePrices = product.billingPrices.filter(
    (price) => price.active && price.interval === interval,
  );
  const currentPrices = activePrices.filter(
    (price) => price.metadata?.isLegacy !== 'true',
  );
  const candidates = currentPrices.length > 0 ? currentPrices : activePrices;

  if (candidates.length === 0) {
    throw new BillingException(
      `No active price for interval ${interval}.`,
      BillingExceptionCode.BILLING_PRICE_NOT_FOUND,
    );
  }

  if (candidates.length > 1) {
    throw new BillingException(
      `Multiple current prices for interval ${interval}: ${candidates
        .map((price) => price.stripePriceId)
        .join(', ')}.`,
      BillingExceptionCode.BILLING_PRICE_INVALID,
    );
  }

  const [price] = candidates;

  if (!price) {
    throw new BillingException(
      `No active price for interval ${interval}.`,
      BillingExceptionCode.BILLING_PRICE_NOT_FOUND,
    );
  }

  return price;
};
