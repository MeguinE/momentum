import { beforeEach, describe, expect, it } from "vitest";
import { createEmptyData, loadData } from "../storage/storage";
import {
  $habitData,
  addHabit,
  archiveHabit,
  deleteHabit,
  logHabit,
  updateHabit,
} from "./habitsStore";

describe("habitsStore", () => {
  beforeEach(() => {
    localStorage.clear();
    $habitData.set(createEmptyData());
  });

  it("agrega un hábito y lo persiste en storage", () => {
    const habit = addHabit({ name: "Lectura", unit: "count", unitLabel: "páginas", dailyGoal: 10, color: "progress" });

    expect($habitData.get().habits).toEqual([habit]);
    expect(loadData().habits).toEqual([habit]);
    expect(habit.archived).toBe(false);
    expect(habit.id).toBeTruthy();
    expect(habit.createdAt).toBeTruthy();
  });

  it("actualiza un hábito existente", () => {
    const habit = addHabit({ name: "Lectura", unit: "boolean", color: "progress" });

    updateHabit(habit.id, { name: "Lectura diaria", why: "quiero ser alguien que lee" });

    const updated = $habitData.get().habits.find((h) => h.id === habit.id);
    expect(updated?.name).toBe("Lectura diaria");
    expect(updated?.why).toBe("quiero ser alguien que lee");
    expect(loadData().habits[0].name).toBe("Lectura diaria");
  });

  it("archiva un hábito sin eliminarlo", () => {
    const habit = addHabit({ name: "Estudio", unit: "duration", unitLabel: "minutos", color: "achievement" });

    archiveHabit(habit.id);

    const archived = $habitData.get().habits.find((h) => h.id === habit.id);
    expect(archived?.archived).toBe(true);
  });

  it("registra el cumplimiento de un día, creando el log si no existe", () => {
    const habit = addHabit({ name: "Lectura", unit: "boolean", color: "progress" });

    logHabit(habit.id, "2026-03-10", 1);

    expect($habitData.get().logs).toEqual([{ habitId: habit.id, date: "2026-03-10", value: 1 }]);
    expect(loadData().logs).toEqual([{ habitId: habit.id, date: "2026-03-10", value: 1 }]);
  });

  it("actualiza el valor de un log existente para el mismo día", () => {
    const habit = addHabit({ name: "Lectura", unit: "count", color: "progress" });
    logHabit(habit.id, "2026-03-10", 5);

    logHabit(habit.id, "2026-03-10", 8);

    expect($habitData.get().logs).toEqual([{ habitId: habit.id, date: "2026-03-10", value: 8 }]);
  });

  it("elimina el log si se registra un valor de 0 o menos (desmarcar)", () => {
    const habit = addHabit({ name: "Lectura", unit: "boolean", color: "progress" });
    logHabit(habit.id, "2026-03-10", 1);

    logHabit(habit.id, "2026-03-10", 0);

    expect($habitData.get().logs).toEqual([]);
  });

  it("elimina un hábito y sus registros asociados", () => {
    const habit = addHabit({ name: "Estudio", unit: "boolean", color: "achievement" });
    $habitData.set({
      ...$habitData.get(),
      logs: [{ habitId: habit.id, date: "2026-01-01", value: 1 }],
    });

    deleteHabit(habit.id);

    expect($habitData.get().habits).toEqual([]);
    expect($habitData.get().logs).toEqual([]);
    expect(loadData().habits).toEqual([]);
  });
});
