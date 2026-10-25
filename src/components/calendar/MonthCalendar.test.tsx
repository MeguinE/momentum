import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createEmptyData } from "../../lib/storage/storage";
import { $habitData, addHabit } from "../../lib/stores/habitsStore";
import MonthCalendar from "./MonthCalendar";

const TODAY = new Date("2026-03-15T12:00:00.000Z");

/** Crea un hábito con fecha de creación anterior al rango de prueba, y
 * luego vuelve el reloj a "hoy" para renderizar el calendario. */
function createHabitBeforeTestRange() {
  vi.setSystemTime(new Date("2026-01-01T12:00:00.000Z"));
  const habit = addHabit({ name: "Lectura", unit: "boolean", color: "progress" });
  vi.setSystemTime(TODAY);
  return habit;
}

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

describe("MonthCalendar", () => {
  it("muestra el mes actual y navega entre meses", () => {
    render(<MonthCalendar today={TODAY} />);

    expect(screen.getByText(/marzo 2026/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /mes siguiente/i }));
    expect(screen.getByText(/abril 2026/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /mes anterior/i }));
    fireEvent.click(screen.getByRole("button", { name: /mes anterior/i }));
    expect(screen.getByText(/febrero 2026/i)).toBeInTheDocument();
  });

  it("al hacer click en un día pasado se abre el panel de edición con los hábitos de ese día", () => {
    createHabitBeforeTestRange();
    render(<MonthCalendar today={TODAY} />);

    fireEvent.click(screen.getByRole("gridcell", { name: /10 de marzo/i }));

    expect(screen.getByText(/10 de marzo/i)).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: /lectura/i })).toBeInTheDocument();
  });

  it("los días futuros están deshabilitados y no abren el panel", () => {
    render(<MonthCalendar today={TODAY} />);

    const futureDay = screen.getByRole("gridcell", { name: /16 de marzo/i });
    expect(futureDay).toBeDisabled();

    fireEvent.click(futureDay);

    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });

  it("se navega entre días con las flechas del teclado", () => {
    render(<MonthCalendar today={TODAY} />);

    const day2 = screen.getByRole("gridcell", { name: /^2 de marzo,/i });
    day2.focus();
    expect(day2).toHaveFocus();

    fireEvent.keyDown(day2, { key: "ArrowRight" });
    expect(screen.getByRole("gridcell", { name: /^3 de marzo,/i })).toHaveFocus();

    fireEvent.keyDown(screen.getByRole("gridcell", { name: /^3 de marzo,/i }), { key: "ArrowDown" });
    expect(screen.getByRole("gridcell", { name: /^10 de marzo,/i })).toHaveFocus();
  });

  it("las flechas del teclado no mueven el foco hacia un día futuro deshabilitado", () => {
    render(<MonthCalendar today={TODAY} />);

    const today15 = screen.getByRole("gridcell", { name: /^15 de marzo,/i });
    today15.focus();

    fireEvent.keyDown(today15, { key: "ArrowDown" });

    expect(today15).toHaveFocus();
  });

  it("registrar un hábito en un día pasado actualiza su etiqueta de cumplimiento", () => {
    createHabitBeforeTestRange();
    render(<MonthCalendar today={TODAY} />);

    fireEvent.click(screen.getByRole("gridcell", { name: /10 de marzo/i }));
    fireEvent.click(screen.getByRole("checkbox", { name: /lectura/i }));

    expect(screen.getByRole("gridcell", { name: /10 de marzo, 1 de 1 hábitos cumplidos/i })).toBeInTheDocument();
  });
});
