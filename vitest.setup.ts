import "@testing-library/jest-dom/vitest";

// jsdom no implementa `window.matchMedia`. Varios módulos (ej. themeStore)
// lo usan para detectar `prefers-color-scheme`, así que se mockea aquí de
// forma global para todos los tests.
// jsdom tampoco implementa `ResizeObserver`, usado por recharts
// (`ResponsiveContainer`) para medir el contenedor de las gráficas.
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }) as unknown as MediaQueryList;
}

// jsdom tampoco implementa `window.confirm` (lanza "not implemented"). Se
// define un valor por defecto para que los tests que no necesitan un
// resultado específico no generen ruido; los que sí lo necesitan lo
// sobreescriben con `vi.spyOn(window, "confirm")`.
if (typeof window !== "undefined") {
  window.confirm = () => true;
}
