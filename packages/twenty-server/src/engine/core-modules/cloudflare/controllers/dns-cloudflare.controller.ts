import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';

import { isNonEmptyString } from '@sniptt/guards';
import { ApiPath } from 'twenty-shared/types';

import { CloudflareSecretMatchGuard } from 'src/engine/core-modules/cloudflare/guards/cloudflare-secret.guard';
import { DnsCloudflareService } from 'src/engine/core-modules/cloudflare/services/dns-cloudflare.service';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { PublicEndpointGuard } from 'src/engine/guards/public-endpoint.guard';

@Controller(ApiPath.Cloudflare)
export class DnsCloudflareController {
  constructor(private readonly dnsCloudflareService: DnsCloudflareService) {}

  @Post('custom-hostnames')
  @HttpCode(200)
  @UseGuards(CloudflareSecretMatchGuard, PublicEndpointGuard, NoPermissionGuard)
  async customHostnameWebhooks(
    @Body() body: { hostname?: string },
  ): Promise<void> {
    if (!isNonEmptyString(body?.hostname)) {
      return;
    }

    await this.dnsCloudflareService.checkHostname(body.hostname);
  }
}
