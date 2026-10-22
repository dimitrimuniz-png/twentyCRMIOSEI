export const getCalendarMonthPeriod = (
  date: Date,
): { periodStart: Date; periodEnd: Date } => {
  const periodStart = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1),
  );
  const periodEnd = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1),
  );

  return { periodStart, periodEnd };
};
