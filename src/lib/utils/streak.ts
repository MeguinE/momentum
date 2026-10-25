/**
 * Cálculo de rachas de cumplimiento. Lógica pura (sin acceso a storage ni
 * al DOM) para poder probarla con fechas fijas, sin depender del reloj
 * real. Ver docs/design.md, principio "don't break the chain".
 */

import { addDays, format, isAfter, isBefore, parseISO, startOfDay, subDays } from "date-fns";
import type { Habit, HabitLog } from "../types";

/** El hábito ya existía ese día (se creó ese mismo día o antes). */
export function habitExistedOn(habit: Habit, day: Date): boolean {
  return !isAfter(startOfDay(parseISO(habit.createdAt)), startOfDay(day));
}

export interface DayCompletion {
  completedCount: number;
  totalCount: number;
  /** 0 a 1, o `null` si ningún hábito existía todavía ese día. */
  ratio: number | null;
}

/**
 * Cumplimiento de un día concreto, entre los hábitos que ya existían esa
 * fecha. Usado tanto por el calendario como por las estadísticas, para no
 * duplicar esta regla en los dos lugares.
 */
export function computeDayCompletion(habits: Habit[], logs: HabitLog[], day: Date): DayCompletion {
  const existingHabits = habits.filter((habit) => habitExistedOn(habit, day));
  if (existingHabits.length === 0) {
    return { completedCount: 0, totalCount: 0, ratio: null };
  }
  const dateKey = formatDateKey(day);
  const completedCount = existingHabits.filter((habit) =>
    isHabitCompleted(habit, getLogForDate(logs, habit.id, dateKey)),
  ).length;
  return { completedCount, totalCount: existingHabits.length, ratio: completedCount / existingHabits.length };
}

export function formatDateKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function todayKey(): string {
  return formatDateKey(new Date());
}

export function getLogForDate(
  logs: HabitLog[],
  habitId: string,
  date: string,
): HabitLog | undefined {
  return logs.find((log) => log.habitId === habitId && log.date === date);
}

/**
 * Un hábito booleano se completa con cualquier valor >= 1. Uno de
 * cantidad/duración se completa al alcanzar su meta diaria, o con
 * cualquier valor positivo si no tiene meta definida.
 */
export function isHabitCompleted(habit: Habit, log: HabitLog | undefined): boolean {
  if (!log) {
    return false;
  }
  if (habit.unit === "boolean") {
    return log.value >= 1;
  }
  if (habit.dailyGoal) {
    return log.value >= habit.dailyGoal;
  }
  return log.value > 0;
}

/**
 * Racha actual: días consecutivos cumplidos contando hacia atrás desde
 * `referenceDate` (por defecto, ahora). El día de hoy no rompe la racha
 * si todavía no se registró (puede completarse más tarde); cualquier
 * otro hueco sí la rompe. No cuenta más atrás de la fecha de creación
 * del hábito.
 */
export function calculateCurrentStreak(
  habit: Habit,
  logs: HabitLog[],
  referenceDate: Date = new Date(),
): number {
  const createdAtDay = startOfDay(parseISO(habit.createdAt));
  const habitLogs = logs.filter((log) => log.habitId === habit.id);

  let streak = 0;
  let cursor = startOfDay(referenceDate);
  let isFirstDay = true;

  while (!isBefore(cursor, createdAtDay)) {
    const log = getLogForDate(habitLogs, habit.id, formatDateKey(cursor));
    const completed = isHabitCompleted(habit, log);

    if (completed) {
      streak += 1;
    } else if (!isFirstDay) {
      break;
    }

    cursor = subDays(cursor, 1);
    isFirstDay = false;
  }

  return streak;
}

/**
 * Mejor racha histórica: la corrida más larga de días consecutivos
 * cumplidos en todo el historial del hábito, aunque ya no esté activa.
 */
export function calculateBestStreak(
  habit: Habit,
  logs: HabitLog[],
  today: Date = new Date(),
): number {
  const completedDates = new Set(
    logs
      .filter((log) => log.habitId === habit.id && isHabitCompleted(habit, log))
      .map((log) => log.date),
  );

  if (completedDates.size === 0) {
    return 0;
  }

  const earliest = parseISO([...completedDates].sort()[0]);
  const end = startOfDay(today);

  let best = 0;
  let current = 0;
  let cursor = startOfDay(earliest);

  while (!isAfter(cursor, end)) {
    if (completedDates.has(formatDateKey(cursor))) {
      current += 1;
      best = Math.max(best, current);
    } else {
      current = 0;
    }
    cursor = addDays(cursor, 1);
  }

  return best;
}
