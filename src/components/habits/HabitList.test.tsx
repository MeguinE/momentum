import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createEmptyData } from "../../lib/storage/storage";
import { loadData } from "../../lib/storage/storage";
import { $habitData, addHabit } from "../../lib/stores/habitsStore";
import HabitList from "./HabitList";

beforeEach(() => {
  history.replaceState(null, '', '/habits');
  localStorage.clear();
  $habitData.set(createEmptyData());
});

afterEach(() => {
  cleanup();
});

function openNewHabitForm() {
  fireEvent.click(screen.getByRole("button", { name: /nuevo hábito/i }));
}

function createHabit(name: string) {
  openNewHabitForm();
  fireEvent.change(screen.getByLabelText(/nombre/i), { target: { value: name } });
  fireEvent.click(screen.getByRole("button", { name: /guardar/i }));
}

describe("HabitList", () => {
  it("muestra un estado vacío cuando no hay hábitos", () => {
    render(<HabitList />);
    expect(screen.getByText(/todavía no hay hábitos/i)).toBeInTheDocument();
  });

  it("crea un hábito desde el formulario y lo muestra en la lista", () => {
    render(<HabitList />);

    createHabit("Lectura");

    expect(screen.getByText("Lectura")).toBeInTheDocument();
  });

  it("edita un hábito existente", () => {
    render(<HabitList />);
    createHabit("Lectura");

    fireEvent.click(screen.getByRole("button", { name: /editar lectura/i }));
    fireEvent.change(screen.getByLabelText(/nombre/i), { target: { value: "Lectura diaria" } });
    fireEvent.click(screen.getByRole("button", { name: /guardar/i }));

    expect(screen.getByText("Lectura diaria")).toBeInTheDocument();
    expect(screen.queryByText("Lectura")).not.toBeInTheDocument();
  });

  it("archiva un hábito y lo mueve a la sección de archivados", () => {
    render(<HabitList />);
    createHabit("Lectura");

    fireEvent.click(screen.getByRole("button", { name: /archivar lectura/i }));

    const archivedSection = screen.getByRole("region", { name: /archivados/i });
    expect(within(archivedSection).getByText("Lectura")).toBeInTheDocument();
  });

  it("reactiva un hábito archivado", () => {
    render(<HabitList />);
    createHabit("Lectura");
    fireEvent.click(screen.getByRole("button", { name: /archivar lectura/i }));

    fireEvent.click(screen.getByRole("button", { name: /reactivar lectura/i }));

    expect(screen.queryByRole("region", { name: /archivados/i })).not.toBeInTheDocument();
    expect(screen.getByText("Lectura")).toBeInTheDocument();
  });

  it("elimina un hábito tras confirmar", () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<HabitList />);
    createHabit("Lectura");

    fireEvent.click(screen.getByRole("button", { name: /eliminar lectura/i }));

    expect(screen.queryByText("Lectura")).not.toBeInTheDocument();
    confirmSpy.mockRestore();
  });

  it("no elimina el hábito si se cancela la confirmación", () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<HabitList />);
    createHabit("Lectura");

    fireEvent.click(screen.getByRole("button", { name: /eliminar lectura/i }));

    expect(screen.getByText("Lectura")).toBeInTheDocument();
    confirmSpy.mockRestore();
  });
});

describe("editing regressions", () => {
  it("opens creation from the dashboard and removes the query when cancelled", () => {
    history.replaceState(null, '', '/habits?new=1');
    render(<HabitList/>);
    expect(screen.getByRole('region',{name:'Crear hábito'})).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button',{name:'Cancelar'}));
    expect(location.search).toBe('');
  });
  it("retries a failed save without duplicating the new habit", () => {
    const failure = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(()=>{throw new Error('storage unavailable');});
    render(<HabitList/>);
    createHabit('Lectura');
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect($habitData.get().habits).toHaveLength(1);
    failure.mockRestore();
    fireEvent.click(screen.getByRole('button',{name:'Guardar'}));
    expect(loadData().habits).toHaveLength(1);
    expect(screen.getByRole('status')).toHaveTextContent('Cambios guardados');
  });
  it("returns keyboard focus to the edit button after cancelling", () => {
    addHabit({name:'Lectura',unit:'boolean',color:'progress'});
    render(<HabitList/>);
    const edit = screen.getByRole('button',{name:'Editar Lectura'});
    fireEvent.click(edit);
    fireEvent.click(screen.getByRole('button',{name:'Cancelar'}));
    expect(edit).toHaveFocus();
  });
  it("opens the editor inside the selected card and switches values between habits", () => {
    addHabit({name:"Inglés",unit:"duration",dailyGoal:15,unitLabel:"minutos",color:"progress"});
    addHabit({name:"Movimiento",unit:"duration",dailyGoal:20,unitLabel:"minutos",color:"success"});
    render(<HabitList/>);
    fireEvent.click(screen.getByRole("button",{name:"Editar Inglés"}));
    expect(within(screen.getByRole("region",{name:"Edición de Inglés"})).getByLabelText("Nombre")).toHaveValue("Inglés");
    fireEvent.change(screen.getByLabelText("Nombre"),{target:{value:"Borrador"}});
    fireEvent.click(screen.getByRole("button",{name:"Editar Movimiento"}));
    expect(screen.getByLabelText("Nombre")).toHaveValue("Movimiento");
    expect(screen.getByLabelText("Meta diaria")).toHaveValue(20);
    fireEvent.change(screen.getByLabelText("Meta diaria"),{target:{value:"10"}});
    fireEvent.click(screen.getByRole("button",{name:"Guardar"}));
    expect(loadData().habits[0].name).toBe("Inglés");
    expect(loadData().habits[1].dailyGoal).toBe(10);
  });
  it("clears optional values, preserves history and saves the selected icon", () => {
    const habit=addHabit({name:"Lectura",unit:"count",dailyGoal:10,unitLabel:"páginas",why:"Motivación vieja",color:"progress"});
    $habitData.set({...$habitData.get(),logs:[{habitId:habit.id,date:"2026-10-25",value:5}]});
    render(<HabitList/>);
    fireEvent.click(screen.getByRole("button",{name:"Editar Lectura"}));
    fireEvent.click(screen.getByText("Personalizar icono, color y motivación"));
    fireEvent.change(screen.getByLabelText(/por qué/i),{target:{value:""}});
    fireEvent.change(screen.getByLabelText(/cómo quieres registrarlo/i),{target:{value:"boolean"}});
    fireEvent.click(screen.getByRole("button",{name:"Icono: Bienestar"}));
    fireEvent.click(screen.getByRole("button",{name:"Guardar"}));
    const stored=loadData();
    expect(stored.habits[0]).toMatchObject({id:habit.id,unit:"boolean",icon:"heart"});
    expect(stored.habits[0].why).toBeUndefined();
    expect(stored.habits[0].dailyGoal).toBeUndefined();
    expect(stored.habits[0].unitLabel).toBeUndefined();
    expect(stored.logs).toEqual([{habitId:habit.id,date:"2026-10-25",value:5}]);
  });
  it("cancel leaves stored values unchanged", () => {
    addHabit({name:"Lectura",unit:"boolean",color:"progress"});
    render(<HabitList/>);
    fireEvent.click(screen.getByRole("button",{name:"Editar Lectura"}));
    fireEvent.change(screen.getByLabelText("Nombre"),{target:{value:"Otro"}});
    fireEvent.click(screen.getByRole("button",{name:"Cancelar"}));
    expect(loadData().habits[0].name).toBe("Lectura");
  });
});
