/**
 * Lógica pura del tema claro/oscuro. Sin efectos secundarios, para poder
 * probarla sin un DOM real.
 *
 * Nota: el script inline en `BaseLayout.astro` que evita el parpadeo de
 * tema al cargar la página duplica esta misma regla en JS plano, porque
 * debe ejecutarse de forma síncrona antes de pintar y no puede depender de
 * un import de módulo. Si cambias esta función, actualiza también ese
 * script.
 */

export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "habit-tracker:theme";

function isTheme(value: string | null): value is Theme {
  return value === "light" || value === "dark";
}

/**
 * Decide el tema inicial: respeta un valor guardado válido, y si no hay
 * ninguno (o es inválido), usa la preferencia del sistema operativo.
 */
export function resolveInitialTheme(
  storedValue: string | null,
  prefersDark: boolean,
): Theme {
  if (isTheme(storedValue)) {
    return storedValue;
  }
  return prefersDark ? "dark" : "light";
}

export function toggleTheme(theme: Theme): Theme {
  return theme === "dark" ? "light" : "dark";
}
