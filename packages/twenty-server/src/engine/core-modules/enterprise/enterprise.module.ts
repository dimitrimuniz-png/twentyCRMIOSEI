import { Module } from '@nestjs/common';

import { EnterpriseSchemaResolver } from 'src/engine/core-modules/enterprise/resolvers/enterprise-schema.resolver';
import { CustomAiProviderAccessService } from 'src/engine/core-modules/enterprise/services/custom-ai-provider-access.service';
import { EnterprisePlanService } from 'src/engine/core-modules/enterprise/services/enterprise-plan.service';

@Module({
  providers: [
    CustomAiProviderAccessService,
    EnterprisePlanService,
    EnterpriseSchemaResolver,
  ],
  exports: [CustomAiProviderAccessService, EnterprisePlanService],
})
export class EnterpriseModule {}
