/**
 * Exportar/importar un respaldo manual en JSON (docs/design.md). No
 * toca `localStorage` directamente: solo serializa/valida; quien llama
 * decide qué hacer con el resultado (descargar el archivo, reemplazar
 * los datos del store, etc.).
 */

import { CURRENT_SCHEMA_VERSION, isHabitTrackerData, type HabitTrackerData } from "./storage";

export function serializeBackup(data: HabitTrackerData): string {
  return JSON.stringify(data, null, 2);
}

export type ParseBackupResult = { ok: true; data: HabitTrackerData } | { ok: false; error: string };

/**
 * Valida el contenido de un archivo de respaldo. Nunca lanza: cualquier
 * problema (JSON inválido, forma inesperada, versión incompatible) se
 * refleja en `{ ok: false, error }`.
 */
export function parseBackup(raw: string): ParseBackupResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: "El archivo no es un JSON válido." };
  }

  if (!isHabitTrackerData(parsed)) {
    return { ok: false, error: "El archivo no tiene la forma esperada de un respaldo." };
  }

  if (parsed.version !== CURRENT_SCHEMA_VERSION) {
    return {
      ok: false,
      error: `Versión de respaldo no compatible (${parsed.version}). Esta app usa la versión ${CURRENT_SCHEMA_VERSION}.`,
    };
  }

  return { ok: true, data: parsed };
}
