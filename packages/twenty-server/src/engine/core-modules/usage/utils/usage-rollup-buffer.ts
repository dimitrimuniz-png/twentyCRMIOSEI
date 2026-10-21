import { type UsageEvent } from 'src/engine/core-modules/usage/types/usage-event.type';

const scopeKey = (event: UsageEvent): string => {
  const spenders = event.spenders ?? {};
  const spenderKey = Object.keys(spenders)
    .sort()
    .map((key) => `${key}:${spenders[key] ?? ''}`)
    .join('|');
  const periodStart =
    event.periodStart instanceof Date
      ? event.periodStart.toISOString()
      : (event.periodStart ?? '');

  return [
    event.resourceType,
    event.operationType,
    event.unit,
    spenderKey,
    periodStart,
    event.resourceId ?? '',
    event.resourceContext ?? '',
  ].join('\u0000');
};

export class UsageRollupBuffer {
  private readonly rowsByWorkspaceId = new Map<
    string,
    Map<string, UsageEvent>
  >();

  private entryCount = 0;

  constructor(private readonly maxEntries: number) {}

  get isFull(): boolean {
    return this.entryCount >= this.maxEntries;
  }

  increment(workspaceId: string, event: UsageEvent): void {
    const workspaceRows =
      this.rowsByWorkspaceId.get(workspaceId) ?? new Map<string, UsageEvent>();
    const key = scopeKey(event);
    const existing = workspaceRows.get(key);

    if (existing) {
      existing.quantity = (existing.quantity ?? 0) + (event.quantity ?? 0);
      existing.creditsUsedMicro =
        (existing.creditsUsedMicro ?? 0) + (event.creditsUsedMicro ?? 0);

      return;
    }

    workspaceRows.set(key, { ...event });
    this.rowsByWorkspaceId.set(workspaceId, workspaceRows);
    this.entryCount += 1;
  }

  drain(): Map<string, UsageEvent[]> {
    const drained = new Map<string, UsageEvent[]>();

    for (const [workspaceId, rows] of this.rowsByWorkspaceId) {
      drained.set(workspaceId, [...rows.values()]);
    }

    this.rowsByWorkspaceId.clear();
    this.entryCount = 0;

    return drained;
  }
}
