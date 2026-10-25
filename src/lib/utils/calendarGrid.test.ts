import { describe, expect, it } from "vitest";
import type { Habit, HabitLog } from "../types";
import { getMonthGrid } from "./calendarGrid";

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

// El 1 de marzo de 2026 es domingo. Con semanas de lunes a domingo, la
// grilla debe incluir días de febrero (la semana que empieza el lunes 23)
// y de abril, para completar semanas enteras.
describe("getMonthGrid", () => {
  const TODAY = new Date("2026-03-15T12:00:00.000Z");

  it("genera semanas completas de 7 días, empezando en lunes", () => {
    const weeks = getMonthGrid(2026, 2, [], [], TODAY); // marzo = índice 2

    expect(weeks.every((week) => week.length === 7)).toBe(true);
    const allDays = weeks.flat();
    expect(allDays[0].dateKey).toBe("2026-02-23"); // lunes previo al 1 de marzo (domingo)
  });

  it("marca los días fuera del mes actual como inCurrentMonth: false", () => {
    const weeks = getMonthGrid(2026, 2, [], [], TODAY);
    const allDays = weeks.flat();

    const marchDays = allDays.filter((day) => day.inCurrentMonth);
    expect(marchDays).toHaveLength(31);
    expect(allDays.some((day) => !day.inCurrentMonth)).toBe(true);
  });

  it("marca hoy y los días futuros correctamente", () => {
    const weeks = getMonthGrid(2026, 2, [], [], TODAY);
    const allDays = weeks.flat();

    const today = allDays.find((day) => day.dateKey === "2026-03-15");
    const future = allDays.find((day) => day.dateKey === "2026-03-16");
    const past = allDays.find((day) => day.dateKey === "2026-03-14");

    expect(today?.isToday).toBe(true);
    expect(future?.isFuture).toBe(true);
    expect(past?.isFuture).toBe(false);
  });

  it("devuelve completionRatio null en días sin hábitos existentes", () => {
    const habits = [habit({ createdAt: "2026-03-10T12:00:00.000Z" })];
    const weeks = getMonthGrid(2026, 2, habits, [], TODAY);
    const allDays = weeks.flat();

    const beforeCreated = allDays.find((day) => day.dateKey === "2026-03-05");
    expect(beforeCreated?.completionRatio).toBeNull();
  });

  it("calcula el porcentaje de cumplimiento entre los hábitos existentes ese día", () => {
    const habits = [
      habit({ id: "h1", createdAt: "2026-03-01T12:00:00.000Z" }),
      habit({ id: "h2", createdAt: "2026-03-01T12:00:00.000Z" }),
    ];
    const logs: HabitLog[] = [{ habitId: "h1", date: "2026-03-10", value: 1 }];

    const weeks = getMonthGrid(2026, 2, habits, logs, TODAY);
    const day = weeks.flat().find((d) => d.dateKey === "2026-03-10");

    expect(day?.completionRatio).toBe(0.5);
    expect(day?.completedCount).toBe(1);
    expect(day?.totalCount).toBe(2);
  });
});
