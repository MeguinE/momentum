import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createEmptyData } from "../../lib/storage/storage";
import { $habitData, addHabit, logHabit } from "../../lib/stores/habitsStore";
import StatsPage from "./StatsPage";

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

describe("StatsPage", () => {
  it("muestra un estado vacío cuando no hay hábitos", () => {
    render(<StatsPage today={TODAY} />);
    expect(screen.getByText(/todavía no hay datos/i)).toBeInTheDocument();
  });

  it("muestra una fila por hábito con racha actual, mejor racha y % de cumplimiento", () => {
    const habit = addHabit({ name: "Lectura", unit: "boolean", color: "progress" });
    logHabit(habit.id, "2026-03-10", 1);

    render(<StatsPage today={TODAY} />);

    const row = screen.getByRole("row", { name: /lectura/i });
    const cells = within(row).getAllByRole("cell");
    expect(cells.map((cell) => cell.textContent)).toEqual(["Lectura", "1", "1", "100%"]);
  });
});
