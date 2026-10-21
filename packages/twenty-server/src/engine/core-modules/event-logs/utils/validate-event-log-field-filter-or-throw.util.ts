import { type EventLogTable } from 'twenty-shared/types';

import { type EventLogFilterOperand } from 'src/engine/core-modules/event-logs/dtos/event-log-filter-operand.enum';
import { buildEventLogFieldFilterCondition } from 'src/engine/core-modules/event-logs/utils/build-event-log-field-filter-condition.util';

export const validateEventLogFieldFilterOrThrow = ({
  fieldFilter,
  table,
}: {
  fieldFilter: {
    field: string;
    operand: EventLogFilterOperand;
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
