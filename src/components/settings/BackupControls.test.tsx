import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createEmptyData } from "../../lib/storage/storage";
import { $habitData, addHabit } from "../../lib/stores/habitsStore";
import BackupControls from "./BackupControls";

beforeEach(() => {
  localStorage.clear();
  $habitData.set(createEmptyData());
});

afterEach(() => {
  cleanup();
});

function makeFile(content: string, name = "backup.json") {
  return new File([content], name, { type: "application/json" });
}

describe("BackupControls", () => {
  it("exportar genera una descarga con los datos actuales", () => {
    addHabit({ name: "Lectura", unit: "boolean", color: "progress" });

    const createObjectURL = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock-url");
    const revokeObjectURL = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    render(<BackupControls />);
    fireEvent.click(screen.getByRole("button", { name: /exportar datos/i }));

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    const [blob] = createObjectURL.mock.calls[0];
    expect((blob as Blob).type).toBe("application/json");
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");

    createObjectURL.mockRestore();
    revokeObjectURL.mockRestore();
    clickSpy.mockRestore();
  });

  it("importar un respaldo válido reemplaza los datos tras confirmar", async () => {
    addHabit({ name: "Vieja", unit: "boolean", color: "progress" });
    const backup = {
      version: 1,
      habits: [
        {
          id: "nuevo",
          name: "Nueva",
          unit: "boolean",
          color: "progress",
          createdAt: "2026-01-01T00:00:00.000Z",
          archived: false,
        },
      ],
      logs: [],
    };
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

    render(<BackupControls />);
    const input = screen.getByLabelText(/importar datos/i);
    fireEvent.change(input, { target: { files: [makeFile(JSON.stringify(backup))] } });

    await waitFor(() => {
      expect($habitData.get().habits.map((h) => h.name)).toEqual(["Nueva"]);
    });

    confirmSpy.mockRestore();
  });

  it("no reemplaza los datos si se cancela la confirmación", async () => {
    addHabit({ name: "Vieja", unit: "boolean", color: "progress" });
    const backup = { version: 1, habits: [], logs: [] };
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);

    render(<BackupControls />);
    const input = screen.getByLabelText(/importar datos/i);
    fireEvent.change(input, { target: { files: [makeFile(JSON.stringify(backup))] } });

    // Espera a que el callback asíncrono del FileReader haya corrido por
    // completo (llegó a pedir confirmación) antes de revisar que no hubo
    // cambios; de lo contrario esta aserción "nada cambió" puede pasar
    // antes de que el callback real termine, y éste se filtra a un test
    // posterior ya con el mock de `confirm` restaurado.
    await waitFor(() => {
      expect(confirmSpy).toHaveBeenCalledTimes(1);
    });
    expect($habitData.get().habits.map((h) => h.name)).toEqual(["Vieja"]);

    confirmSpy.mockRestore();
  });

  it("muestra un error y no toca los datos si el archivo es inválido", async () => {
    addHabit({ name: "Vieja", unit: "boolean", color: "progress" });

    render(<BackupControls />);
    const input = screen.getByLabelText(/importar datos/i);
    fireEvent.change(input, { target: { files: [makeFile("esto no es json")] } });

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/no es un json válido/i);
    });
    expect($habitData.get().habits.map((h) => h.name)).toEqual(["Vieja"]);
  });
});
