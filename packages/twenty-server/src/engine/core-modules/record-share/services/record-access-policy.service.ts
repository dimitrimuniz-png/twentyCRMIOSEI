import { Injectable } from '@nestjs/common';

import { MetadataReadability, type ObjectRecord } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import { type EventRecordAccessGate } from 'src/engine/core-modules/record-share/types/event-record-access-gate.type';
import { RecordShareStorageService } from 'src/engine/core-modules/record-share/services/record-share-storage.service';
import {
  evaluateRowAccessPolicy,
  type RowAccessRecord,
} from 'src/engine/core-modules/record-share/utils/evaluate-row-access-policy.util';
import { type WorkspaceEventBatch } from 'src/engine/workspace-event-emitter/types/workspace-event-batch.type';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';
import { type RowAccessPolicySubject } from 'src/engine/twenty-orm/types/row-access-policy.type';
import { buildRowAccessPolicy } from 'src/engine/twenty-orm/utils/build-row-access-policy.util';

type EventRecord = {
  recordId: string;
  properties: {
    before?: object;
    after?: object;
  };
};

@Injectable()
export class RecordAccessPolicyService {
  constructor(
    private readonly recordShareStorageService: RecordShareStorageService,
    private readonly workspaceCacheService: WorkspaceCacheService,
  ) {}

  buildEventRecordAccessGate(
    eventBatch: WorkspaceEventBatch<EventRecord>,
  ): EventRecordAccessGate {
    return {
      resolveAdmittedRecordIds: (subject) =>
        this.resolveAdmittedRecordIds(eventBatch, subject),
    };
  }

  private async resolveAdmittedRecordIds(
    eventBatch: WorkspaceEventBatch<EventRecord>,
    subject: RowAccessPolicySubject,
  ): Promise<Set<string>> {
    const flatObjectMetadata = eventBatch.objectMetadata;

    // System rows are not an everyone-visible stream unless the caller is the system or the owner.
    if (
      (flatObjectMetadata.readability === MetadataReadability.SYSTEM ||
        flatObjectMetadata.isSystem === true) &&
      !subject.isSystemContext &&
      !subject.isOwningApplication(flatObjectMetadata)
    ) {
      return new Set();
    }

    const { featureFlagsMap, flatFieldMetadataMaps, flatObjectMetadataMaps } =
      await this.workspaceCacheService.getOrRecompute(eventBatch.workspaceId, [
        'featureFlagsMap',
        'flatFieldMetadataMaps',
        'flatObjectMetadataMaps',
      ]);

    const records = eventBatch.events
      .map((event) => deliveredRecord(event))
      .filter((record): record is RowAccessRecord => isDefined(record));

    const policy = buildRowAccessPolicy({
      subject,
      environment: {
        featureFlagsMap: featureFlagsMap ?? {},
        flatFieldMetadataMaps,
        flatObjectMetadataMaps,
      },
      tableAlias: 'record',
      flatObjectMetadata,
      operationType: 'select',
      depth: 0,
    });

    return evaluateRowAccessPolicy({
      policy,
      records,
      context: {
        flatFieldMetadataMaps,
        shouldIgnoreSoftDeleteDefaultFilter: false,
        fetchRecordShares: async ({ objectMetadataId, recordIds }) => {
          const shares = await this.recordShareStorageService.findByRecordIds({
            workspaceId: eventBatch.workspaceId,
            objectMetadataId,
            recordIds,
          });

          return shares.map((share) => ({
            recordId: share.recordId,
            principalId: share.principalId,
            accessLevel: share.accessLevel,
          }));
        },
      },
    });
  }
}

const deliveredRecord = (event: EventRecord): RowAccessRecord | undefined => {
  const properties = event.properties ?? {};
  const delivered = (properties.after ?? properties.before) as
    | ObjectRecord
    | undefined;

  if (!isDefined(delivered) && !isDefined(event.recordId)) {
    return undefined;
  }

  return {
    ...(delivered ?? {}),
    id: event.recordId,
  };
};
