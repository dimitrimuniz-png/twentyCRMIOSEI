import { Controller, HttpCode, Post, UseGuards } from '@nestjs/common';

import { ApiPath } from 'twenty-shared/types';

import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { PublicEndpointGuard } from 'src/engine/guards/public-endpoint.guard';

@Controller()
export class BillingWebhookController {
  @Post(`${ApiPath.Webhooks}/stripe`)
  @HttpCode(200)
  @UseGuards(PublicEndpointGuard, NoPermissionGuard)
  async handleWebhooks(): Promise<{ received: true }> {
    return { received: true };
  }
}
