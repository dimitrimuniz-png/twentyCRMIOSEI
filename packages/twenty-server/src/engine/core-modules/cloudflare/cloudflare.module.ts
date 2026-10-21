import { Module } from '@nestjs/common';

import { DnsCloudflareService } from 'src/engine/core-modules/cloudflare/services/dns-cloudflare.service';
import { CustomDomainManagerModule } from 'src/engine/core-modules/domain/custom-domain-manager/custom-domain-manager.module';
import { WorkspaceDomainsModule } from 'src/engine/core-modules/domain/workspace-domains/workspace-domains.module';
import { PublicDomainModule } from 'src/engine/core-modules/public-domain/public-domain.module';

@Module({
  imports: [
    WorkspaceDomainsModule,
    CustomDomainManagerModule,
    PublicDomainModule,
  ],
  providers: [DnsCloudflareService],
})
export class CloudflareModule {}
