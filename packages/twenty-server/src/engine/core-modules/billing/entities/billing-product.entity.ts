// A string index signature would match every object and strip those
// properties from flat metadata types.
export class BillingProductEntity {
  private readonly commercialModuleRemoved = true;

  metadata!: {
    priceUsageBased?: string;
    productKey?: string;
  };
}
