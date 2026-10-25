import { describe, expect, it } from "vitest";
import { parseBackup, serializeBackup } from "./backup";
import { CURRENT_SCHEMA_VERSION, createEmptyData } from "./storage";

describe("backup", () => {
  it("serializa y vuelve a leer los mismos datos", () => {
    const data = {
      ...createEmptyData(),
      habits: [
        {
          id: "h1",
          name: "Lectura",
          unit: "boolean" as const,
          color: "progress",
          createdAt: "2026-01-01T00:00:00.000Z",
          archived: false,
        },
      ],
      logs: [{ habitId: "h1", date: "2026-01-01", value: 1 }],
    };

    const result = parseBackup(serializeBackup(data));

    expect(result).toEqual({ ok: true, data });
  });

  it("rechaza un archivo que no es JSON válido", () => {
    const result = parseBackup("esto no es json");
    expect(result.ok).toBe(false);
  });

  it("rechaza un archivo con una forma inesperada", () => {
    const result = parseBackup(JSON.stringify({ foo: "bar" }));
    expect(result.ok).toBe(false);
  });

  it("rechaza una versión de esquema incompatible", () => {
    const result = parseBackup(JSON.stringify({ version: 999, habits: [], logs: [] }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/versión/i);
    }
  });

  it("acepta datos vacíos pero válidos", () => {
    const result = parseBackup(serializeBackup(createEmptyData()));
    expect(result).toEqual({ ok: true, data: { version: CURRENT_SCHEMA_VERSION, habits: [], logs: [] } });
  });
});
