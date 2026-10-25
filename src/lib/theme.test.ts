import { describe, expect, it } from "vitest";
import { resolveInitialTheme, type Theme } from "./theme";

describe("resolveInitialTheme", () => {
  it("usa el valor guardado si es válido, sin importar la preferencia del sistema", () => {
    expect(resolveInitialTheme("dark", false)).toBe<Theme>("dark");
    expect(resolveInitialTheme("light", true)).toBe<Theme>("light");
  });

  it("ignora un valor guardado inválido y usa la preferencia del sistema", () => {
    expect(resolveInitialTheme("algo-invalido", true)).toBe<Theme>("dark");
    expect(resolveInitialTheme("algo-invalido", false)).toBe<Theme>("light");
  });

  it("usa la preferencia del sistema cuando no hay nada guardado", () => {
    expect(resolveInitialTheme(null, true)).toBe<Theme>("dark");
    expect(resolveInitialTheme(null, false)).toBe<Theme>("light");
  });
});
