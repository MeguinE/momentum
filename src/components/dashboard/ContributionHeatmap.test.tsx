import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createEmptyData } from "../../lib/storage/storage";
import { $habitData, addHabit, logHabit } from "../../lib/stores/habitsStore";
import ContributionHeatmap from "./ContributionHeatmap";

const TODAY = new Date("2026-03-10T12:00:00.000Z");

beforeEach(() => {
  localStorage.clear();
  $habitData.set(createEmptyData());
  // `addHabit` usa `new Date()` para `createdAt`; se fija el reloj para que
  // sea consistente con el "hoy" inyectado en el heatmap durante el test.
  vi.useFakeTimers();
  vi.setSystemTime(TODAY);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("ContributionHeatmap", () => {
  it("no renderiza nada cuando no hay hábitos", () => {
    render(<ContributionHeatmap today={TODAY} />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("renderiza una columna por semana", () => {
    addHabit({ name: "Lectura", unit: "boolean", color: "progress" });
    render(<ContributionHeatmap today={TODAY} weeks={3} />);

    expect(screen.getByRole("img", { name: /últimas 3 semanas/i })).toBeInTheDocument();
  });

  it("refleja el cumplimiento de hoy en el título de la celda", () => {
    const habit = addHabit({ name: "Lectura", unit: "boolean", color: "progress" });
    logHabit(habit.id, "2026-03-10", 1);

    render(<ContributionHeatmap today={TODAY} weeks={2} />);

    expect(screen.getByTitle(/10 de marzo: 1 de 1 hábitos cumplidos/i)).toBeInTheDocument();
  });
});
