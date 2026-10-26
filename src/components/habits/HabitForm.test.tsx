import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import HabitForm from "./HabitForm";

afterEach(() => {
  cleanup();
});

describe("HabitForm", () => {
  it("no envía el formulario si falta el nombre", () => {
    const onSubmit = vi.fn();
    render(<HabitForm onSubmit={onSubmit} onCancel={() => {}} />);

    fireEvent.click(screen.getByRole("button", { name: /guardar/i }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/el nombre es obligatorio/i)).toBeInTheDocument();
  });

  it("no muestra meta diaria ni unidad cuando el tipo es booleano", () => {
    render(<HabitForm onSubmit={() => {}} onCancel={() => {}} />);

    expect(screen.queryByLabelText(/meta diaria/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/qué unidad usas/i)).not.toBeInTheDocument();
  });

  it("muestra meta diaria y unidad cuando el tipo es cantidad", () => {
    render(<HabitForm onSubmit={() => {}} onCancel={() => {}} />);

    fireEvent.change(screen.getByLabelText(/cómo quieres registrarlo/i), { target: { value: "count" } });

    expect(screen.getByLabelText(/meta diaria/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/qué unidad usas/i)).toBeInTheDocument();
  });

  it("envía los datos correctos al guardar un hábito de cantidad", () => {
    const onSubmit = vi.fn();
    render(<HabitForm onSubmit={onSubmit} onCancel={() => {}} />);

    fireEvent.change(screen.getByLabelText(/nombre/i), { target: { value: "Lectura" } });
    fireEvent.change(screen.getByLabelText(/cómo quieres registrarlo/i), { target: { value: "count" } });
    fireEvent.change(screen.getByLabelText(/qué unidad usas/i), {
      target: { value: "páginas" },
    });
    fireEvent.change(screen.getByLabelText(/meta diaria/i), { target: { value: "10" } });
    fireEvent.click(screen.getByText("Personalizar icono, color y motivación"));
    fireEvent.change(screen.getByLabelText(/por qué/i), {
      target: { value: "quiero ser alguien que lee" },
    });

    fireEvent.click(screen.getByRole("button", { name: /guardar/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      name: "Lectura",
      unit: "count",
      unitLabel: "páginas",
      dailyGoal: 10,
      color: "progress",
      why: "quiero ser alguien que lee",
    });
  });

  it("precarga los valores de un hábito existente al editar", () => {
    render(
      <HabitForm
        onSubmit={() => {}}
        onCancel={() => {}}
        initialValue={{
          name: "Estudio",
          unit: "duration",
          unitLabel: "minutos",
          dailyGoal: 30,
          color: "achievement",
          why: "",
        }}
      />,
    );

    expect(screen.getByLabelText(/nombre/i)).toHaveValue("Estudio");
    expect(screen.getByLabelText(/meta diaria/i)).toHaveValue(30);
  });
});
