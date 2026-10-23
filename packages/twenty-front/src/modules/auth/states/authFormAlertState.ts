import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';

export const authFormAlertState = createAtomState<string | null>({
  key: 'authFormAlertState',
  defaultValue: null,
});
