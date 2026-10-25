/**
 * Generación pura de la grilla mensual del calendario. Ver docs/design.md
 * (vista `/calendar`).
 */

import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  isAfter,
  isSameDay,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import type { Habit, HabitLog } from "../types";
import { computeDayCompletion, formatDateKey } from "./streak";

export interface CalendarDay {
  date: Date;
  dateKey: string;
  inCurrentMonth: boolean;
  isToday: boolean;
  isFuture: boolean;
  completedCount: number;
  totalCount: number;
  /** 0 a 1, o `null` si ningún hábito existía todavía ese día. */
  completionRatio: number | null;
}

const WEEK_STARTS_ON_MONDAY = { weekStartsOn: 1 as const };

/**
 * Devuelve la grilla del mes (`monthIndex` 0-based, enero = 0) como un
 * arreglo de semanas de 7 días (lunes a domingo), incluyendo los días de
 * los meses adyacentes necesarios para completar la primera y última
 * semana.
 */
export function getMonthGrid(
  year: number,
  monthIndex: number,
  habits: Habit[],
  logs: HabitLog[],
  today: Date = new Date(),
): CalendarDay[][] {
  const monthDate = new Date(year, monthIndex, 1);
  const gridStart = startOfWeek(startOfMonth(monthDate), WEEK_STARTS_ON_MONDAY);
  const gridEnd = endOfWeek(endOfMonth(monthDate), WEEK_STARTS_ON_MONDAY);
  const todayStart = startOfDay(today);

  const days: CalendarDay[] = eachDayOfInterval({ start: gridStart, end: gridEnd }).map((date) => {
    const completion = computeDayCompletion(habits, logs, date);
    return {
      date,
      dateKey: formatDateKey(date),
      inCurrentMonth: date.getMonth() === monthIndex,
      isToday: isSameDay(date, todayStart),
      isFuture: isAfter(startOfDay(date), todayStart),
      completedCount: completion.completedCount,
      totalCount: completion.totalCount,
      completionRatio: completion.ratio,
    };
  });

  const weeks: CalendarDay[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }
  return weeks;
}
