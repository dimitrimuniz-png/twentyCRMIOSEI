import { Injectable } from '@nestjs/common';

import { getCalendarDayPeriod } from 'src/engine/core-modules/usage-limit/utils/get-calendar-day-period.util';
import { getCalendarMonthPeriod } from 'src/engine/core-modules/usage-limit/utils/get-calendar-month-period.util';
import { getCalendarWeekPeriod } from 'src/engine/core-modules/usage-limit/utils/get-calendar-week-period.util';
import { type PeriodUnit } from 'src/engine/core-modules/usage-limit/types/period-unit.type';
import { type UsagePeriod } from 'src/engine/core-modules/usage-limit/types/usage-period.type';

@Injectable()
export class UsagePeriodService {
  async findCurrentPeriodsByUnit({
    periodUnits,
  }: {
    workspaceId: string;
    periodUnits: PeriodUnit[];
  }): Promise<Partial<Record<PeriodUnit, UsagePeriod>>> {
    const now = new Date();
    const periods: Partial<Record<PeriodUnit, UsagePeriod>> = {};

    for (const periodUnit of periodUnits) {
      const period = this.calendarPeriod(periodUnit, now);

      if (period) {
        periods[periodUnit] = period;
      }
    }

    return periods;
  }

  async findCurrentPeriod({
    periodUnit,
  }: {
    workspaceId: string;
    periodUnit: PeriodUnit;
  }): Promise<UsagePeriod | null> {
    return this.calendarPeriod(periodUnit, new Date());
  }

  async hasAllowancePeriod(_workspaceId: string): Promise<boolean> {
    return false;
  }

  private calendarPeriod(
    periodUnit: PeriodUnit,
    now: Date,
  ): UsagePeriod | null {
    switch (periodUnit) {
      case 'day':
        return getCalendarDayPeriod(now);
      case 'week':
        return getCalendarWeekPeriod(now);
      case 'month':
        return getCalendarMonthPeriod(now);
      case 'second':
      case 'allowancePeriod':
      case 'lifetime':
        return null;
      default:
        return null;
    }
  }
}
