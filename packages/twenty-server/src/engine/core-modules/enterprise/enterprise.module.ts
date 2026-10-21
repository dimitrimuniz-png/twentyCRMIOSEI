import { Module } from '@nestjs/common';

import { CustomAiProviderAccessService } from 'src/engine/core-modules/enterprise/services/custom-ai-provider-access.service';
import { EnterprisePlanService } from 'src/engine/core-modules/enterprise/services/enterprise-plan.service';

@Module({
  providers: [
    CustomAiProviderAccessService,
    EnterprisePlanService,
  ],
  exports: [
    CustomAiProviderAccessService,
    EnterprisePlanService,
  ],
})
export class EnterpriseModule {}
