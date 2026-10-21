import { timingSafeEqual } from 'node:crypto';

import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';

import { type Request } from 'express';

import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';

@Injectable()
export class CloudflareSecretMatchGuard implements CanActivate {
  constructor(private readonly twentyConfigService: TwentyConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const secret = this.twentyConfigService.get('CLOUDFLARE_WEBHOOK_SECRET');

    if (!secret) {
      throw new InternalServerErrorException(
        'CLOUDFLARE_WEBHOOK_SECRET is not configured',
      );
    }

    const header = context.switchToHttp().getRequest<Request>().headers[
      'cf-webhook-auth'
    ];

    if (
      typeof header !== 'string' ||
      header.length === 0 ||
      header.length !== secret.length
    ) {
      return false;
    }

    return timingSafeEqual(Buffer.from(header), Buffer.from(secret));
  }
}
