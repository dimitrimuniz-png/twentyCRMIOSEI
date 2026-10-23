import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Req,
  Res,
  UseFilters,
  UseGuards,
} from '@nestjs/common';

import { Request, Response } from 'express';
import { pipeline } from 'node:stream/promises';
import { ApiPath } from 'twenty-shared/types';

import { AuthRestApiExceptionFilter } from 'src/engine/core-modules/auth/filters/auth-rest-api-exception.filter';
import { TrainingService } from 'src/engine/core-modules/training/services/training.service';
import { AuthPrincipalGuard } from 'src/engine/guards/auth-principal.guard';
import { JwtAuthGuard } from 'src/engine/guards/jwt-auth.guard';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';

@Controller(`${ApiPath.Rest}/training`)
@UseGuards(
  JwtAuthGuard,
  AuthPrincipalGuard({
    userSession: {
      standard: true,
      impersonated: true,
      playground: true,
      workspaceAgnostic: false,
    },
    apiKey: true,
    oauthClient: { withUser: true, withoutUser: false },
    application: { withUser: true, withoutUser: false },
  }),
  NoPermissionGuard,
)
@UseFilters(AuthRestApiExceptionFilter)
export class TrainingController {
  constructor(private readonly trainingService: TrainingService) {}

  @Get('catalog')
  async getCatalog(@Res({ passthrough: true }) response: Response) {
    response.setHeader('Cache-Control', 'private, no-store');

    return this.trainingService.getCatalog();
  }

  @Get('media-url/:fileName')
  async getMediaUrl(
    @Param('fileName') fileName: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    response.setHeader('Cache-Control', 'private, no-store');

    return { url: await this.trainingService.getPlaybackUrl(fileName) };
  }

  @Get('media/:fileName')
  async getMedia(
    @Param('fileName') fileName: string,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    const media = await this.trainingService.openMedia({
      fileName,
      rangeHeader: request.header('range'),
    });

    if (media.type === 'redirect') {
      response.setHeader('Cache-Control', 'private, no-store');

      return response.redirect(media.url);
    }

    if (media.type === 'unsatisfiable') {
      response.status(416);
      response.setHeader('Content-Range', `bytes */${media.size}`);

      return response.end();
    }

    response.status(media.type === 'partial' ? 206 : 200);
    response.setHeader('Content-Type', media.mimeType);
    response.setHeader('Content-Disposition', media.contentDisposition);
    response.setHeader('Accept-Ranges', 'bytes');
    response.setHeader('Content-Length', media.contentLength);
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Cache-Control', 'private');

    if (media.type === 'partial') {
      response.setHeader(
        'Content-Range',
        `bytes ${media.startByte}-${media.endByte}/${media.size}`,
      );
    }

    try {
      await pipeline(media.stream, response);
    } catch (error) {
      media.stream.destroy();

      if (!response.headersSent) {
        throw new NotFoundException('Training file not found');
      }

      response.destroy(error instanceof Error ? error : undefined);
    }
  }
}
