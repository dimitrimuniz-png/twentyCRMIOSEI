import { type EventLogTable } from 'twenty-shared/types';

import { type EventLogFilterOperand } from 'src/engine/core-modules/event-logs/dtos/event-log-filter-operand.enum';
import {
  EventLogsException,
  EventLogsExceptionCode,
} from 'src/engine/core-modules/event-logs/event-logs.exception';
import { EVENT_LOG_FILTERABLE_FIELDS } from 'src/engine/core-modules/event-logs/registry/event-log-registry';

const MAX_FILTER_VALUES = 100;

export const buildEventLogFieldFilterCondition = ({
  fieldFilter,
  parameterName,
  table,
}: {
  fieldFilter: {
    field: string;
    operand: EventLogFilterOperand;
    values: string[];
  };
  parameterName: string;
  table: EventLogTable;
}): string => {
  const allowedFields = EVENT_LOG_FILTERABLE_FIELDS[table];

  if (
    !allowedFields.has(fieldFilter.field) ||
    fieldFilter.values.length === 0 ||
    fieldFilter.values.length > MAX_FILTER_VALUES
  ) {
    throw new EventLogsException(
      `Invalid event log filter on "${fieldFilter.field}"`,
      EventLogsExceptionCode.INVALID_FIELD_FILTER,
    );
  }

  const operator = fieldFilter.operand === 'IS_NOT' ? 'NOT IN' : 'IN';

  return `"${fieldFilter.field}" ${operator} {${parameterName}:Array(String)}`;
};
