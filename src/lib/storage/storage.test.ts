import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Habit, HabitLog } from "../types";
import {
  createEmptyData,
  loadData,
  saveData,
  STORAGE_KEY,
} from "./storage";

const sampleHabit: Habit = {
  id: "habit-1",
  name: "Lectura",
  unit: "count",
  unitLabel: "páginas",
  dailyGoal: 10,
  color: "progress",
  createdAt: "2026-01-01T00:00:00.000Z",
  archived: false,
};

const sampleLog: HabitLog = {
  habitId: "habit-1",
  date: "2026-01-01",
  value: 12,
};

describe("storage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("devuelve datos vacíos cuando no hay nada guardado", () => {
    const data = loadData();
    expect(data).toEqual(createEmptyData());
  });

  it("guarda y vuelve a leer los mismos datos", () => {
    const data = { ...createEmptyData(), habits: [sampleHabit], logs: [sampleLog] };

    const result = saveData(data);

    expect(result.ok).toBe(true);
    expect(loadData()).toEqual(data);
  });

  it("se recupera de un JSON corrupto devolviendo datos vacíos", () => {
    localStorage.setItem(STORAGE_KEY, "{ esto no es json válido");

    expect(loadData()).toEqual(createEmptyData());
  });

  it("se recupera de datos con una forma inesperada devolviendo datos vacíos", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ foo: "bar" }));

    expect(loadData()).toEqual(createEmptyData());
  });

  it("se recupera de una versión de esquema desconocida devolviendo datos vacíos", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 9999, habits: [], logs: [] }),
    );

    expect(loadData()).toEqual(createEmptyData());
  });

  it("devuelve un resultado de error si localStorage lanza (ej. cuota excedida), sin lanzar", () => {
    const setItemSpy = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new DOMException("quota exceeded", "QuotaExceededError");
      });

    const result = saveData(createEmptyData());

    expect(result).toEqual({ ok: false, error: "QuotaExceededError" });
    setItemSpy.mockRestore();
  });
});
