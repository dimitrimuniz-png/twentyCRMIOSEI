/* eslint-disable @typescript-eslint/no-explicit-any */
// Self-hosted fork: commercial module removed. This stub keeps AGPL imports compiling.
type RemovedCommercial = any;

export class RecordShareException {
  constructor(..._args: unknown[]) {
    return new Proxy(this, {
      get(target, property, receiver) {
        if (property === 'then') return undefined;
        const own = Reflect.get(target, property, receiver);
        if (own !== undefined) return own;
        return (..._ignored: unknown[]) => undefined;
      },
    });
  }
  [key: string]: RemovedCommercial;
}

export enum RecordShareExceptionCode {
  INVALID_SHARE_WITH = 'INVALID_SHARE_WITH',
  TRANSACTION_SCOPE_WORKSPACE_MISMATCH = 'TRANSACTION_SCOPE_WORKSPACE_MISMATCH',
}
