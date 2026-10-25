import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createEmptyData } from "../../lib/storage/storage";
import { $habitData, addHabit, logHabit } from "../../lib/stores/habitsStore";
import { formatDateKey } from "../../lib/utils/streak";
import SummaryCards from "./SummaryCards";

const TODAY = new Date("2026-03-10T12:00:00.000Z");

beforeEach(() => {
  localStorage.clear();
  $habitData.set(createEmptyData());
  vi.useFakeTimers();
  vi.setSystemTime(TODAY);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("SummaryCards", () => {
  it("muestra ceros y sin celebración cuando no hay hábitos", () => {
    render(<SummaryCards today={TODAY} />);

    expect(screen.getByText(/0 \/ 0/)).toBeInTheDocument();
    expect(screen.queryByText(/completaste todos tus hábitos/i)).not.toBeInTheDocument();
  });

  it("muestra el progreso de hoy y la racha más larga", () => {
    const habit = addHabit({ name: "Lectura", unit: "boolean", color: "progress" });
    addHabit({ name: "Estudio", unit: "boolean", color: "achievement" });
    logHabit(habit.id, formatDateKey(TODAY), 1);

    render(<SummaryCards today={TODAY} />);

    expect(screen.getByText("1 / 2")).toBeInTheDocument();
    expect(screen.getByRole("group", { name: /racha más larga: 1/i })).toBeInTheDocument();
  });

  it("muestra un mensaje de celebración al completar todos los hábitos de hoy", () => {
    const habit = addHabit({ name: "Lectura", unit: "boolean", color: "progress" });
    logHabit(habit.id, formatDateKey(TODAY), 1);

    render(<SummaryCards today={TODAY} />);

    expect(screen.getByText(/completaste todos tus hábitos de hoy/i)).toBeInTheDocument();
  });

  it("muestra el día actual desde el primer hábito como 'Día 1' el día de creación", () => {
    addHabit({ name: "Lectura", unit: "boolean", color: "progress" });

    render(<SummaryCards today={TODAY} />);

    expect(screen.getByRole("group", { name: /día 1/i })).toBeInTheDocument();
  });
});
