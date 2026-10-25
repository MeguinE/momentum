import { describe, expect, it } from "vitest";
import type { Habit, HabitLog } from "../types";
import { calculateBestStreak, calculateCurrentStreak, isHabitCompleted } from "./streak";

function makeHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: "habit-1",
    name: "Lectura",
    unit: "boolean",
    color: "progress",
    createdAt: "2020-01-01T00:00:00.000Z",
    archived: false,
    ...overrides,
  };
}

function log(date: string, value = 1): HabitLog {
  return { habitId: "habit-1", date, value };
}

const TODAY = new Date("2026-03-10T12:00:00.000Z");
const YESTERDAY = "2026-03-09";
const TWO_DAYS_AGO = "2026-03-08";
const THREE_DAYS_AGO = "2026-03-07";

describe("isHabitCompleted", () => {
  it("un hábito boolean se completa con cualquier valor >= 1", () => {
    expect(isHabitCompleted(makeHabit(), log("2026-03-10", 1))).toBe(true);
    expect(isHabitCompleted(makeHabit(), log("2026-03-10", 0))).toBe(false);
  });

  it("sin log, nunca está completado", () => {
    expect(isHabitCompleted(makeHabit(), undefined)).toBe(false);
  });

  it("un hábito de cantidad sin meta se completa con cualquier valor positivo", () => {
    const habit = makeHabit({ unit: "count" });
    expect(isHabitCompleted(habit, log("2026-03-10", 3))).toBe(true);
    expect(isHabitCompleted(habit, log("2026-03-10", 0))).toBe(false);
  });

  it("un hábito de cantidad con meta solo se completa al alcanzarla", () => {
    const habit = makeHabit({ unit: "count", dailyGoal: 10 });
    expect(isHabitCompleted(habit, log("2026-03-10", 9))).toBe(false);
    expect(isHabitCompleted(habit, log("2026-03-10", 10))).toBe(true);
    expect(isHabitCompleted(habit, log("2026-03-10", 15))).toBe(true);
  });
});

describe("calculateCurrentStreak", () => {
  it("es 0 cuando no hay ningún registro", () => {
    expect(calculateCurrentStreak(makeHabit(), [], TODAY)).toBe(0);
  });

  it("cuenta 1 si solo hoy está cumplido", () => {
    const habit = makeHabit();
    expect(calculateCurrentStreak(habit, [log("2026-03-10")], TODAY)).toBe(1);
  });

  it("cuenta días consecutivos hacia atrás desde hoy", () => {
    const habit = makeHabit();
    const logs = [log("2026-03-10"), log(YESTERDAY), log(TWO_DAYS_AGO)];
    expect(calculateCurrentStreak(habit, logs, TODAY)).toBe(3);
  });

  it("no se rompe si hoy todavía no se registró, pero ayer sí", () => {
    const habit = makeHabit();
    expect(calculateCurrentStreak(habit, [log(YESTERDAY)], TODAY)).toBe(1);
  });

  it("se rompe en el primer hueco anterior a hoy", () => {
    const habit = makeHabit();
    // hoy cumplido, ayer NO cumplido, hace 2 días cumplido -> la racha es solo de hoy
    const logs = [log("2026-03-10"), log(TWO_DAYS_AGO)];
    expect(calculateCurrentStreak(habit, logs, TODAY)).toBe(1);
  });

  it("no cuenta más atrás de la fecha de creación del hábito", () => {
    const habit = makeHabit({ createdAt: "2026-03-10T08:00:00.000Z" });
    expect(calculateCurrentStreak(habit, [log("2026-03-10")], TODAY)).toBe(1);
  });
});

describe("calculateBestStreak", () => {
  it("es 0 cuando no hay ningún registro cumplido", () => {
    expect(calculateBestStreak(makeHabit(), [], TODAY)).toBe(0);
  });

  it("encuentra la racha más larga aunque ya haya terminado", () => {
    const habit = makeHabit();
    const logs = [
      log(THREE_DAYS_AGO),
      log(TWO_DAYS_AGO),
      log(YESTERDAY),
      // hueco en "hoy": no se registró
    ];
    expect(calculateBestStreak(habit, logs, TODAY)).toBe(3);
  });

  it("toma la racha más larga entre varias, no la más reciente", () => {
    const habit = makeHabit();
    const logs = [
      log("2026-03-01"),
      log("2026-03-02"),
      log("2026-03-03"),
      // hueco
      log("2026-03-10"),
    ];
    expect(calculateBestStreak(habit, logs, TODAY)).toBe(3);
  });
});
