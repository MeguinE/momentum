/**
 * Agregaciones puras para la página `/stats`. Ver docs/design.md.
 */

import {
  addDays,
  differenceInCalendarDays,
  eachDayOfInterval,
  format,
  parseISO,
  startOfDay,
  startOfWeek,
  subDays,
  subWeeks,
} from "date-fns";
import type { Habit, HabitLog } from "../types";
import { calculateBestStreak, calculateCurrentStreak, computeDayCompletion, formatDateKey, isHabitCompleted } from "./streak";

const WEEK_STARTS_ON_MONDAY = { weekStartsOn: 1 as const };

export interface DailyCompletionPoint {
  date: string;
  label: string;
  /** 0 a 100. */
  rate: number;
}

/** Tendencia diaria de cumplimiento (línea), para los últimos `days` días. */
export function getDailyCompletionTrend(
  habits: Habit[],
  logs: HabitLog[],
  days: number,
  today: Date = new Date(),
): DailyCompletionPoint[] {
  const points: DailyCompletionPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = subDays(startOfDay(today), i);
    const completion = computeDayCompletion(habits, logs, day);
    const rate = completion.ratio === null ? 0 : Math.round(completion.ratio * 100);
    points.push({ date: formatDateKey(day), label: format(day, "d/MM"), rate });
  }
  return points;
}

export interface WeeklyTotalPoint {
  weekLabel: string;
  total: number;
}

/** Total de hábitos cumplidos por semana (barras), para las últimas `weeks` semanas. */
export function getWeeklyTotals(
  habits: Habit[],
  logs: HabitLog[],
  weeks: number,
  today: Date = new Date(),
): WeeklyTotalPoint[] {
  const currentWeekStart = startOfWeek(today, WEEK_STARTS_ON_MONDAY);
  const points: WeeklyTotalPoint[] = [];

  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = subWeeks(currentWeekStart, i);
    const weekDays = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) });
    const total = weekDays.reduce(
      (sum, day) => sum + computeDayCompletion(habits, logs, day).completedCount,
      0,
    );
    points.push({ weekLabel: format(weekStart, "d/MM"), total });
  }

  return points;
}

export interface HabitStatsRow {
  habitId: string;
  name: string;
  currentStreak: number;
  bestStreak: number;
  /** 0 a 100, desde la creación del hábito hasta hoy. */
  completionRate: number;
  archived: boolean;
}

/** Tabla de racha actual, mejor racha y % de cumplimiento por hábito. */
export function getHabitStatsTable(
  habits: Habit[],
  logs: HabitLog[],
  today: Date = new Date(),
): HabitStatsRow[] {
  return habits.map((habit) => {
    const habitLogs = logs.filter((log) => log.habitId === habit.id);
    const totalDays =
      differenceInCalendarDays(startOfDay(today), startOfDay(parseISO(habit.createdAt))) + 1;
    const completedDays = new Set(
      habitLogs.filter((log) => isHabitCompleted(habit, log)).map((log) => log.date),
    ).size;

    return {
      habitId: habit.id,
      name: habit.name,
      currentStreak: calculateCurrentStreak(habit, habitLogs, today),
      bestStreak: calculateBestStreak(habit, habitLogs, today),
      completionRate: totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0,
      archived: habit.archived,
    };
  });
}
