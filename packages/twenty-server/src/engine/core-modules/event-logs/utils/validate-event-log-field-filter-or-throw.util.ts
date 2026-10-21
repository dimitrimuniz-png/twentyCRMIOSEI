import { type EventLogTable } from 'twenty-shared/types';

import { buildEventLogFieldFilterCondition } from 'src/engine/core-modules/event-logs/utils/build-event-log-field-filter-condition.util';

export const validateEventLogFieldFilterOrThrow = ({
  fieldFilter,
  table,
}: {
  fieldFilter: {
    field: string;
    operand: 'IS' | 'IS_NOT';
    values: string[];
  };
  table: EventLogTable;
}): void => {
  buildEventLogFieldFilterCondition({
    fieldFilter,
    parameterName: 'values',
    table,
  });
};
