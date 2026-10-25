import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { THEME_STORAGE_KEY } from "../../lib/theme";
import { setTheme } from "../../lib/stores/themeStore";
import ThemeToggle from "./ThemeToggle";

describe("ThemeToggle", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
    setTheme("light");
  });

  afterEach(() => {
    cleanup();
  });

  it("empieza en modo claro y cambia a oscuro al hacer click", () => {
    render(<ThemeToggle />);
    const button = screen.getByRole("button", { name: /cambiar a modo oscuro/i });
    expect(button).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(button);

    expect(screen.getByRole("button", { name: /cambiar a modo claro/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
  });

  it("vuelve a modo claro en un segundo click", () => {
    render(<ThemeToggle />);
    const button = screen.getByRole("button", { name: /cambiar a modo oscuro/i });

    fireEvent.click(button);
    fireEvent.click(screen.getByRole("button", { name: /cambiar a modo claro/i }));

    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
  });
});
