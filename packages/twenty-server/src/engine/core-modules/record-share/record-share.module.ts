import { Module } from '@nestjs/common';

import { RecordSharePrincipalService } from 'src/engine/core-modules/record-share/services/record-share-principal.service';
import { WorkspaceCacheModule } from 'src/engine/workspace-cache/workspace-cache.module';
import { RecordAccessPolicyService } from 'src/engine/core-modules/record-share/services/record-access-policy.service';
import { RecordSharingService } from 'src/engine/core-modules/record-share/services/record-sharing.service';
import { ShareWithService } from 'src/engine/core-modules/record-share/services/share-with.service';
import { RecordShareOwnershipTransferService } from 'src/engine/core-modules/record-share/services/record-share-ownership-transfer.service';
import { RecordShareStorageService } from 'src/engine/core-modules/record-share/services/record-share-storage.service';
import { RecordSharingResolver } from 'src/engine/core-modules/record-share/resolvers/record-sharing.resolver';

@Module({
  imports: [WorkspaceCacheModule],
  providers: [
    RecordSharePrincipalService,
    RecordAccessPolicyService,
    RecordSharingService,
    ShareWithService,
    RecordShareOwnershipTransferService,
    RecordShareStorageService,
    RecordSharingResolver,
  ],
  exports: [
    RecordSharePrincipalService,
    RecordAccessPolicyService,
    RecordSharingService,
    ShareWithService,
    RecordShareOwnershipTransferService,
    RecordShareStorageService,
  ],
})
export class RecordShareModule {}
