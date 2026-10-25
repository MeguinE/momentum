/**
 * Modelo de datos del dominio "hábitos". Ver docs/design.md para el
 * detalle y el razonamiento de cada campo.
 */

export type HabitUnit = "boolean" | "count" | "duration";

export interface Habit {
  id: string;
  name: string;
  /** Optional icon; older habits choose one automatically from their name. */
  icon?: string;
  /** Motivación / identidad opcional (principio de Atomic Habits). */
  why?: string;
  unit: HabitUnit;
  /** Etiqueta de la unidad, ej. "páginas", "minutos". No aplica a "boolean". */
  unitLabel?: string;
  /** Meta diaria. No aplica a "boolean" (ahí la meta siempre es 1). */
  dailyGoal?: number;
  /** Token de color de la paleta (docs/design.md). */
  color: string;
  /** Fecha ISO de creación. */
  createdAt: string;
  archived: boolean;
}

export interface HabitLog {
  habitId: string;
  /** Fecha en formato YYYY-MM-DD, en horario local del usuario. */
  date: string;
  /** 1/0 para hábitos "boolean", cantidad para "count"/"duration". */
  value: number;
  note?: string;
}
