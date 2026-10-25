/**
 * Única capa que toca `localStorage` directamente para los datos de
 * hábitos (ver docs/design.md). Cualquier otro módulo debe pasar por
 * aquí, nunca acceder a `localStorage` por su cuenta.
 *
 * Diseñada para no lanzar nunca: ante JSON corrupto, forma inesperada,
 * versión de esquema desconocida o errores del navegador (ej. cuota
 * excedida), se degrada a datos vacíos o a un resultado de error, para
 * que el resto de la app no se caiga por un problema de almacenamiento.
 */

import type { Habit, HabitLog } from "../types";

export const STORAGE_KEY = "habit-tracker:data";
export const CURRENT_SCHEMA_VERSION = 1;

export interface HabitTrackerData {
  wellnessInitialized?: boolean;
  learning?: Record<string, import("../learning").LearningProgress>;
  version: number;
  habits: Habit[];
  logs: HabitLog[];
}

export type SaveResult = { ok: true } | { ok: false; error: string };

export function createEmptyData(): HabitTrackerData {
  return { version: CURRENT_SCHEMA_VERSION, habits: [], logs: [] };
}

export function isHabitTrackerData(value: unknown): value is HabitTrackerData {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.version === "number" &&
    (candidate.wellnessInitialized === undefined || typeof candidate.wellnessInitialized === "boolean") &&
    Array.isArray(candidate.habits) &&
    Array.isArray(candidate.logs) &&
    (candidate.learning === undefined || (
      typeof candidate.learning === "object" && candidate.learning !== null && !Array.isArray(candidate.learning) &&
      Object.values(candidate.learning).every((entry) => entry && typeof entry === "object" && typeof entry.habitId === "string" && Array.isArray(entry.completed) && entry.completed.every((id: unknown) => typeof id === "string") &&
        (entry.notes === undefined || (typeof entry.notes === "object" && entry.notes !== null && !Array.isArray(entry.notes) && Object.values(entry.notes).every(note => typeof note === "string"))))
    ))
  );
}

/**
 * Lee los datos de `localStorage`. Si no existen, están corruptos, no
 * tienen la forma esperada, o la versión de esquema no es la que esta
 * versión de la app sabe leer, devuelve datos vacíos en vez de lanzar.
 *
 * Nota: por ahora solo existe `CURRENT_SCHEMA_VERSION = 1`, así que no hay
 * una cadena de migraciones que ejecutar. Cuando exista una v2, este es el
 * lugar para agregarla.
 */
export function loadData(): HabitTrackerData {
  let raw: string | null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return createEmptyData();
  }

  if (raw === null) {
    return createEmptyData();
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return createEmptyData();
  }

  if (!isHabitTrackerData(parsed)) {
    return createEmptyData();
  }

  if (parsed.version !== CURRENT_SCHEMA_VERSION) {
    return createEmptyData();
  }

  return parsed;
}

/**
 * Guarda los datos en `localStorage`. Nunca lanza: si falla (ej. cuota
 * excedida, almacenamiento deshabilitado), devuelve `{ ok: false, error }`
 * para que el caller pueda mostrar un aviso al usuario.
 */
export function saveData(data: HabitTrackerData): SaveResult {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return { ok: true };
  } catch (err) {
    const error = err instanceof DOMException ? err.name : "UnknownStorageError";
    return { ok: false, error };
  }
}
