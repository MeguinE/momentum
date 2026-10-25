/**
 * Grilla para el heatmap de contribuciones estilo GitHub, mostrado en el
 * dashboard (docs/design.md). Columnas = semanas (lunes a domingo),
 * terminando en la semana de hoy.
 */

import { addDays, addWeeks, eachDayOfInterval, isAfter, startOfDay, startOfWeek, subWeeks } from "date-fns";
import type { Habit, HabitLog } from "../types";
import { computeDayCompletion, formatDateKey } from "./streak";

const WEEK_STARTS_ON_MONDAY = { weekStartsOn: 1 as const };

export interface ContributionDay {
  date: Date;
  dateKey: string;
  isFuture: boolean;
  completedCount: number;
  totalCount: number;
  /** 0 a 1, o `null` si ningún hábito existía todavía ese día. */
  ratio: number | null;
}

export function getContributionGrid(
  habits: Habit[],
  logs: HabitLog[],
  weeksCount: number,
  today: Date = new Date(),
): ContributionDay[][] {
  const todayStart = startOfDay(today);
  const currentWeekStart = startOfWeek(todayStart, WEEK_STARTS_ON_MONDAY);
  const firstWeekStart = subWeeks(currentWeekStart, weeksCount - 1);

  const weeks: ContributionDay[][] = [];
  for (let w = 0; w < weeksCount; w++) {
    const weekStart = addWeeks(firstWeekStart, w);
    const days = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) }).map((date) => {
      const completion = computeDayCompletion(habits, logs, date);
      return {
        date,
        dateKey: formatDateKey(date),
        isFuture: isAfter(startOfDay(date), todayStart),
        completedCount: completion.completedCount,
        totalCount: completion.totalCount,
        ratio: completion.ratio,
      };
    });
    weeks.push(days);
  }

  return weeks;
}
