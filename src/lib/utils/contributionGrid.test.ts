import { describe, expect, it } from "vitest";
import type { Habit, HabitLog } from "../types";
import { getContributionGrid } from "./contributionGrid";

function habit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: "h1",
    name: "Lectura",
    unit: "boolean",
    color: "progress",
    createdAt: "2026-01-01T12:00:00.000Z",
    archived: false,
    ...overrides,
  };
}

const TODAY = new Date("2026-03-10T12:00:00.000Z"); // martes

describe("getContributionGrid", () => {
  it("devuelve `weeksCount` columnas de 7 días cada una", () => {
    const weeks = getContributionGrid([], [], 4, TODAY);

    expect(weeks).toHaveLength(4);
    expect(weeks.every((week) => week.length === 7)).toBe(true);
  });

  it("la última columna termina en la semana de hoy, y hoy es el último día no futuro", () => {
    const weeks = getContributionGrid([], [], 2, TODAY);
    const lastWeek = weeks[weeks.length - 1];

    const todayCell = lastWeek.find((day) => day.dateKey === "2026-03-10");
    expect(todayCell?.isFuture).toBe(false);

    const tomorrowCell = lastWeek.find((day) => day.dateKey === "2026-03-11");
    expect(tomorrowCell?.isFuture).toBe(true);
  });

  it("calcula el ratio de cumplimiento de cada día con los hábitos existentes", () => {
    const habits = [habit({ id: "h1" }), habit({ id: "h2" })];
    const logs: HabitLog[] = [{ habitId: "h1", date: "2026-03-10", value: 1 }];

    const weeks = getContributionGrid(habits, logs, 2, TODAY);
    const todayCell = weeks.flat().find((day) => day.dateKey === "2026-03-10");

    expect(todayCell?.ratio).toBe(0.5);
    expect(todayCell?.completedCount).toBe(1);
    expect(todayCell?.totalCount).toBe(2);
  });

  it("devuelve ratio null en días sin hábitos existentes todavía", () => {
    const habits = [habit({ createdAt: "2026-03-10T12:00:00.000Z" })];
    const weeks = getContributionGrid(habits, [], 2, TODAY);
    const earlierDay = weeks.flat().find((day) => day.dateKey === "2026-03-05");

    expect(earlierDay?.ratio).toBeNull();
  });
});
