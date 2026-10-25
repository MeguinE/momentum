import { atom } from "nanostores";
import { resolveInitialTheme, THEME_STORAGE_KEY, toggleTheme, type Theme } from "../theme";

/**
 * Store de nanostores para el tema claro/oscuro, compartido entre las
 * islas de React. El valor inicial se resuelve solo en el navegador
 * (guardas de `typeof document`), porque este módulo también se evalúa en
 * Node durante el renderizado estático de Astro.
 */
function getInitialTheme(): Theme {
  if (typeof document === "undefined") {
    return "light";
  }
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  return resolveInitialTheme(stored, prefersDark);
}

export const $theme = atom<Theme>(getInitialTheme());

function applyThemeToDocument(theme: Theme): void {
  if (typeof document === "undefined") {
    return;
  }
  document.documentElement.classList.toggle("dark", theme === "dark");
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

export function setTheme(theme: Theme): void {
  $theme.set(theme);
  applyThemeToDocument(theme);
}

export function flipTheme(): void {
  setTheme(toggleTheme($theme.get()));
}
