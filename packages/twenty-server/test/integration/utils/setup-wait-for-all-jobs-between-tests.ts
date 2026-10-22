import { Client } from 'pg';

import {
  SEED_APPLE_WORKSPACE_ID,
  SEED_YCOMBINATOR_WORKSPACE_ID,
} from 'src/engine/workspace-manager/dev-seeder/core/constants/seeder-workspaces.constant';
import {
  closeQueueConnections,
  waitForAllJobsToFinish,
} from 'test/integration/utils/wait-for-all-jobs-to-finish.util';

const WAIT_FOR_JOBS_HOOK_TIMEOUT_MS = 150_000;

beforeAll(async () => {
  await waitForAllJobsToFinish();
}, WAIT_FOR_JOBS_HOOK_TIMEOUT_MS);

afterEach(async () => {
  jest.useRealTimers();
  await waitForAllJobsToFinish();
}, WAIT_FOR_JOBS_HOOK_TIMEOUT_MS);

afterAll(async () => {
  await releaseWorkspacesCreatedByTheFile();
  await closeQueueConnections();
}, WAIT_FOR_JOBS_HOOK_TIMEOUT_MS);

// The workspace cap stays closed on this fork. A file that signs up has to
// leave those workspaces soft-deleted, or the next file in the shard hits it.
const releaseWorkspacesCreatedByTheFile = async (): Promise<void> => {
  const connectionString = process.env.PG_DATABASE_URL;

  if (connectionString === undefined || connectionString.length === 0) {
    return;
  }

  const client = new Client({ connectionString });

  await client.connect();

  try {
    await client.query(
      `UPDATE core.workspace
       SET "deletedAt" = NOW()
       WHERE "deletedAt" IS NULL
         AND id <> ALL($1::uuid[])`,
      [[SEED_APPLE_WORKSPACE_ID, SEED_YCOMBINATOR_WORKSPACE_ID]],
    );
  } finally {
    await client.end();
  }
};
