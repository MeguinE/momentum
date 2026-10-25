/**
 * Agregaciones puras para el dashboard. Ver docs/design.md.
 */

import { differenceInCalendarDays, parseISO, startOfDay } from "date-fns";
import type { Habit, HabitLog } from "../types";
import { calculateCurrentStreak, formatDateKey, getLogForDate, isHabitCompleted } from "./streak";

export interface DashboardSummary {
  completedToday: number;
  totalActive: number;
  longestCurrentStreak: number;
  /** Días desde que se creó el primer hábito (archivado o no). `null` si no hay ninguno. */
  daysSinceStart: number | null;
}

export function computeDashboardSummary(
  habits: Habit[],
  logs: HabitLog[],
  today: Date = new Date(),
): DashboardSummary {
  const activeHabits = habits.filter((habit) => !habit.archived);
  const dateKey = formatDateKey(today);

  const completedToday = activeHabits.filter((habit) =>
    isHabitCompleted(habit, getLogForDate(logs, habit.id, dateKey)),
  ).length;

  const longestCurrentStreak = activeHabits.reduce(
    (max, habit) => Math.max(max, calculateCurrentStreak(habit, logs, today)),
    0,
  );

  const daysSinceStart =
    habits.length === 0
      ? null
      : differenceInCalendarDays(
          startOfDay(today),
          startOfDay(parseISO([...habits].map((h) => h.createdAt).sort()[0])),
        );

  return {
    completedToday,
    totalActive: activeHabits.length,
    longestCurrentStreak,
    daysSinceStart,
  };
}
