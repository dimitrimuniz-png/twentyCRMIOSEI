const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Monday 00:00 UTC through the following Monday, independent of billing.
export const getCalendarWeekPeriod = (
  date: Date,
): { periodStart: Date; periodEnd: Date } => {
  const periodStart = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const daysSinceMonday = (periodStart.getUTCDay() + 6) % 7;

  periodStart.setUTCDate(periodStart.getUTCDate() - daysSinceMonday);

  return {
    periodStart,
    periodEnd: new Date(periodStart.getTime() + 7 * MS_PER_DAY),
  };
};
