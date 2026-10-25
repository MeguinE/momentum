import { describe, expect, it } from "vitest";
import type { Habit, HabitLog } from "../types";
import { computeDashboardSummary } from "./dashboard";

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

const TODAY = new Date("2026-03-10T12:00:00.000Z");

describe("computeDashboardSummary", () => {
  it("devuelve ceros y daysSinceStart null sin hábitos", () => {
    expect(computeDashboardSummary([], [], TODAY)).toEqual({
      completedToday: 0,
      totalActive: 0,
      longestCurrentStreak: 0,
      daysSinceStart: null,
    });
  });

  it("cuenta solo los hábitos activos para completados hoy", () => {
    const habits = [habit({ id: "h1" }), habit({ id: "h2", archived: true })];
    const logs: HabitLog[] = [
      { habitId: "h1", date: "2026-03-10", value: 1 },
      { habitId: "h2", date: "2026-03-10", value: 1 },
    ];

    const summary = computeDashboardSummary(habits, logs, TODAY);

    expect(summary.completedToday).toBe(1);
    expect(summary.totalActive).toBe(1);
  });

  it("toma la racha actual más larga entre los hábitos activos", () => {
    const habits = [habit({ id: "h1" }), habit({ id: "h2" })];
    const logs: HabitLog[] = [
      { habitId: "h1", date: "2026-03-10", value: 1 },
      { habitId: "h2", date: "2026-03-10", value: 1 },
      { habitId: "h2", date: "2026-03-09", value: 1 },
    ];

    expect(computeDashboardSummary(habits, logs, TODAY).longestCurrentStreak).toBe(2);
  });

  it("calcula los días desde el hábito más antiguo (incluye archivados)", () => {
    const habits = [
      habit({ id: "h1", createdAt: "2026-03-05T12:00:00.000Z" }),
      habit({ id: "h2", createdAt: "2026-03-01T12:00:00.000Z", archived: true }),
    ];

    expect(computeDashboardSummary(habits, [], TODAY).daysSinceStart).toBe(9);
  });
});
