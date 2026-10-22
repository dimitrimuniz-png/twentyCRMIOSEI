import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SsoResolver } from 'src/engine/core-modules/sso/sso.resolver';
import { SsoService } from 'src/engine/core-modules/sso/services/sso.service';
import { WorkspaceSsoIdentityProviderEntity } from 'src/engine/core-modules/sso/workspace-sso-identity-provider.entity';
import { TwentyConfigModule } from 'src/engine/core-modules/twenty-config/twenty-config.module';
import { PermissionsModule } from 'src/engine/metadata-modules/permissions/permissions.module';

@Module({
  imports: [
    TwentyConfigModule,
    PermissionsModule,
    TypeOrmModule.forFeature([WorkspaceSsoIdentityProviderEntity]),
  ],
  providers: [SsoService, SsoResolver],
  exports: [SsoService],
})
export class WorkspaceSsoModule {}
