import { describe, expect, it } from "vitest";
import type { Habit, HabitLog } from "../types";
import { getDailyCompletionTrend, getHabitStatsTable, getWeeklyTotals } from "./stats";

function habit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: "h1",
    name: "Lectura",
    unit: "boolean",
    color: "progress",
    createdAt: "2026-03-01T12:00:00.000Z",
    archived: false,
    ...overrides,
  };
}

const TODAY = new Date("2026-03-10T12:00:00.000Z"); // martes

describe("getDailyCompletionTrend", () => {
  it("devuelve un punto por día, con el % de cumplimiento de ese día", () => {
    const habits = [habit()];
    const logs: HabitLog[] = [
      { habitId: "h1", date: "2026-03-08", value: 1 },
      { habitId: "h1", date: "2026-03-10", value: 0 },
    ];

    const trend = getDailyCompletionTrend(habits, logs, 3, TODAY);

    expect(trend).toHaveLength(3);
    expect(trend.map((p) => p.rate)).toEqual([100, 0, 0]); // 08, 09, 10
  });

  it("devuelve 0 en días sin hábitos existentes todavía", () => {
    const habits = [habit({ createdAt: "2026-03-10T12:00:00.000Z" })];
    const trend = getDailyCompletionTrend(habits, [], 2, TODAY);

    expect(trend.map((p) => p.rate)).toEqual([0, 0]); // 09 (no existía), 10 (existe, sin log)
  });
});

describe("getWeeklyTotals", () => {
  it("suma los días cumplidos de cada semana (lunes a domingo)", () => {
    const habits = [habit()];
    // semana del 2 al 8 de marzo: 2 días cumplidos; semana del 9 al 10: 1 día
    const logs: HabitLog[] = [
      { habitId: "h1", date: "2026-03-03", value: 1 },
      { habitId: "h1", date: "2026-03-05", value: 1 },
      { habitId: "h1", date: "2026-03-09", value: 1 },
    ];

    const totals = getWeeklyTotals(habits, logs, 2, TODAY);

    expect(totals).toHaveLength(2);
    expect(totals.map((w) => w.total)).toEqual([2, 1]);
  });
});

describe("getHabitStatsTable", () => {
  it("calcula racha actual, mejor racha y % de cumplimiento por hábito", () => {
    const habits = [habit({ createdAt: "2026-03-06T12:00:00.000Z" })]; // 5 días hasta hoy inclusive
    const logs: HabitLog[] = [
      { habitId: "h1", date: "2026-03-06", value: 1 },
      { habitId: "h1", date: "2026-03-07", value: 1 },
      { habitId: "h1", date: "2026-03-10", value: 1 },
    ];

    const [row] = getHabitStatsTable(habits, logs, TODAY);

    expect(row.name).toBe("Lectura");
    expect(row.currentStreak).toBe(1);
    expect(row.bestStreak).toBe(2);
    expect(row.completionRate).toBe(60); // 3 de 5 días
    expect(row.archived).toBe(false);
  });

  it("incluye hábitos archivados marcados como tal", () => {
    const habits = [habit({ archived: true })];
    const [row] = getHabitStatsTable(habits, [], TODAY);

    expect(row.archived).toBe(true);
  });
});
