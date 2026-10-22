import type Stripe from 'stripe';

type SubscriptionItemWithId = {
  id?: string;
};

export const getDeletedStripeSubscriptionItemIdsFromStripeSubscriptionEvent = (
  event: Stripe.CustomerSubscriptionUpdatedEvent,
): string[] => {
  const previousItems = event.data.previous_attributes?.items?.data as
    | SubscriptionItemWithId[]
    | undefined;

  if (!previousItems) {
    return [];
  }

  const currentItemIds = new Set(
    event.data.object.items.data.map((item) => item.id),
  );

  return previousItems.flatMap((item) =>
    item.id && !currentItemIds.has(item.id) ? [item.id] : [],
  );
};
