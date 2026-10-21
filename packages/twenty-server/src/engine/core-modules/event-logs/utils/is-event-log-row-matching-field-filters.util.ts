import { type EventLogFilterOperand } from 'src/engine/core-modules/event-logs/dtos/event-log-filter-operand.enum';

export const isEventLogRowMatchingFieldFilters = ({
  row,
  fieldFilters,
}: {
  row: Record<string, unknown>;
  fieldFilters: Array<{
    field: string;
    operand: EventLogFilterOperand;
    values: string[];
  }>;
}): boolean =>
  fieldFilters.every((fieldFilter) => {
    const value = row[fieldFilter.field];
    const comparable = value === undefined || value === null ? '' : String(value);
    const listed = fieldFilter.values.includes(comparable);

    return fieldFilter.operand === 'IS_NOT' ? !listed : listed;
  });
