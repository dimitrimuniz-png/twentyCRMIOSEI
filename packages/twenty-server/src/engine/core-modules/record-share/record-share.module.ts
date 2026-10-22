import { Module } from '@nestjs/common';

import { RecordShareStorageModule } from 'src/engine/core-modules/record-share/record-share-storage.module';
import { RecordSharePrincipalService } from 'src/engine/core-modules/record-share/services/record-share-principal.service';
import { RecordPermissionsModule } from 'src/engine/metadata-modules/record-permissions/record-permissions.module';
import { UserRoleModule } from 'src/engine/metadata-modules/user-role/user-role.module';
import { WorkspaceCacheModule } from 'src/engine/workspace-cache/workspace-cache.module';
import { RecordAccessPolicyService } from 'src/engine/core-modules/record-share/services/record-access-policy.service';
import { RecordSharingService } from 'src/engine/core-modules/record-share/services/record-sharing.service';
import { ShareWithService } from 'src/engine/core-modules/record-share/services/share-with.service';
import { RecordShareOwnershipTransferService } from 'src/engine/core-modules/record-share/services/record-share-ownership-transfer.service';
import { RecordSharingResolver } from 'src/engine/core-modules/record-share/resolvers/record-sharing.resolver';

@Module({
  imports: [
    WorkspaceCacheModule,
    RecordPermissionsModule,
    UserRoleModule,
    RecordShareStorageModule,
  ],
  providers: [
    RecordSharePrincipalService,
    RecordAccessPolicyService,
    RecordSharingService,
    ShareWithService,
    RecordShareOwnershipTransferService,
    RecordSharingResolver,
  ],
  exports: [
    RecordSharePrincipalService,
    RecordAccessPolicyService,
    RecordSharingService,
    ShareWithService,
    RecordShareOwnershipTransferService,
    RecordShareStorageModule,
  ],
})
export class RecordShareModule {}
