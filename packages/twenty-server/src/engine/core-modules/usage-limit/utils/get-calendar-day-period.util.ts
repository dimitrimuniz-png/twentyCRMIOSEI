const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const getCalendarDayPeriod = (
  date: Date,
): { periodStart: Date; periodEnd: Date } => {
  const periodStart = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );

  return {
    periodStart,
    periodEnd: new Date(periodStart.getTime() + MS_PER_DAY),
  };
};
