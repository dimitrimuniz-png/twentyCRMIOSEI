import {
  BillingException,
  BillingExceptionCode,
} from 'src/engine/core-modules/billing/billing.exception';
import { BillingProductKey } from 'src/engine/core-modules/billing/enums/billing-product-key.enum';

type SellableBaseProductPrice = {
  stripePriceId: string;
  active: boolean;
  metadata?: {
    isLegacy?: string;
  };
  billingProduct: {
    active: boolean;
    metadata: {
      productKey?: string;
      isLegacy?: string;
    };
  };
};

// Billing stays inactive. The lookup only exists so a stored catalog still
// resolves to one current base price instead of a legacy or credit price.
export const findSellableBaseProductPriceOrThrow = <
  TPrice extends SellableBaseProductPrice,
>(
  prices: TPrice[],
): TPrice => {
  const sellablePrices = prices.filter(
    (price) =>
      price.active &&
      price.metadata?.isLegacy !== 'true' &&
      price.billingProduct.active &&
      price.billingProduct.metadata.productKey ===
        BillingProductKey.BASE_PRODUCT &&
      price.billingProduct.metadata.isLegacy !== 'true',
  );

  if (sellablePrices.length === 0) {
    throw new BillingException(
      'No sellable base product price.',
      BillingExceptionCode.BILLING_PRICE_NOT_FOUND,
    );
  }

  if (sellablePrices.length > 1) {
    throw new BillingException(
      `Multiple sellable base product prices: ${sellablePrices
        .map((price) => price.stripePriceId)
        .join(', ')}.`,
      BillingExceptionCode.BILLING_PRICE_INVALID,
    );
  }

  const [price] = sellablePrices;

  if (!price) {
    throw new BillingException(
      'No sellable base product price.',
      BillingExceptionCode.BILLING_PRICE_NOT_FOUND,
    );
  }

  return price;
};
