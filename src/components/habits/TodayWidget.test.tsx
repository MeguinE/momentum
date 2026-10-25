import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createEmptyData } from "../../lib/storage/storage";
import { $habitData, addHabit } from "../../lib/stores/habitsStore";
import { formatDateKey } from "../../lib/utils/streak";
import TodayWidget from "./TodayWidget";

const TODAY = new Date("2026-03-10T12:00:00.000Z");

beforeEach(() => {
  localStorage.clear();
  $habitData.set(createEmptyData());
  // `addHabit` usa `new Date()` para `createdAt`; se fija el reloj para que
  // sea consistente con el "hoy" inyectado en el widget durante el test.
  vi.useFakeTimers();
  vi.setSystemTime(TODAY);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("TodayWidget", () => {
  it("muestra un estado vacío cuando no hay hábitos", () => {
    render(<TodayWidget today={TODAY} />);
    expect(screen.getByText(/todavía no tienes hábitos/i)).toBeInTheDocument();
  });

  it("marcar un hábito booleano actualiza la racha a 1 al instante", () => {
    addHabit({ name: "Lectura", unit: "boolean", color: "progress" });
    render(<TodayWidget today={TODAY} />);

    fireEvent.click(screen.getByRole("checkbox", { name: /lectura/i }));

    expect(screen.getByText(/racha: 1/i)).toBeInTheDocument();
    expect($habitData.get().logs).toEqual([
      { habitId: $habitData.get().habits[0].id, date: formatDateKey(TODAY), value: 1 },
    ]);
  });

  it("desmarcar un hábito booleano vuelve la racha a 0", () => {
    addHabit({ name: "Lectura", unit: "boolean", color: "progress" });
    render(<TodayWidget today={TODAY} />);
    const checkbox = screen.getByRole("checkbox", { name: /lectura/i });

    fireEvent.click(checkbox);
    fireEvent.click(checkbox);

    expect(screen.getByText(/racha: 0/i)).toBeInTheDocument();
  });

  it("incrementar un hábito de cantidad suma al valor de hoy", () => {
    addHabit({ name: "Estudio", unit: "count", unitLabel: "páginas", dailyGoal: 5, color: "achievement" });
    render(<TodayWidget today={TODAY} />);

    fireEvent.click(screen.getByRole("button", { name: /\+1 a estudio/i }));
    fireEvent.click(screen.getByRole("button", { name: /\+1 a estudio/i }));

    expect(screen.getByText(/2 \/ 5 páginas/i)).toBeInTheDocument();
  });

  it("alcanzar la meta diaria cuenta como racha de 1", () => {
    addHabit({ name: "Estudio", unit: "count", dailyGoal: 2, color: "achievement" });
    render(<TodayWidget today={TODAY} />);

    fireEvent.click(screen.getByRole("button", { name: /\+1 a estudio/i }));
    fireEvent.click(screen.getByRole("button", { name: /\+1 a estudio/i }));

    expect(screen.getByText(/racha: 1/i)).toBeInTheDocument();
  });
});
