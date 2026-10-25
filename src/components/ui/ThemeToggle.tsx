import { useStore } from "@nanostores/react";
import { Moon, Sun } from "lucide-react";
import { $theme, flipTheme } from "../../lib/stores/themeStore";

/**
 * Botón accesible para alternar entre modo claro y oscuro. El estado
 * vive en `themeStore` (nanostores) y se persiste en localStorage; este
 * componente solo refleja y dispara ese cambio.
 */
export default function ThemeToggle() {
  const theme = useStore($theme);
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={flipTheme}
      aria-pressed={isDark}
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      className="theme-toggle"
    >
      <span className="theme-toggle-icons">
        <Sun className={`theme-toggle-icon ${isDark ? "is-hidden" : "is-visible"}`} size={18} aria-hidden="true" />
        <Moon className={`theme-toggle-icon ${isDark ? "is-visible" : "is-hidden"}`} size={18} aria-hidden="true" />
      </span>
    </button>
  );
}
