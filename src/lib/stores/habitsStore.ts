import { learningPaths, lessonKey, requiredSteps, canCompleteLesson } from "../learning";
import { atom } from "nanostores";
import { createEmptyData, loadData, saveData, type HabitTrackerData } from "../storage/storage";
import type { Habit } from "../types";

/**
 * Store de nanostores con todos los hábitos y registros, compartido entre
 * las islas de React. Cada mutación se persiste de inmediato a través de
 * la capa de storage (ver docs/design.md).
 */
function getInitialData(): HabitTrackerData {
  if (typeof document === "undefined") {
    return createEmptyData();
  }
  return loadData();
}

export const $habitData = atom<HabitTrackerData>(getInitialData());

/** Último error de guardado, si lo hubo. Las islas pueden suscribirse a
 * esto para mostrar un aviso (ej. "no se pudo guardar"). */
export const $saveError = atom<string | null>(null);

export const $dataReady = atom(true);
let writeData = saveData;
export function setDataWriter(writer: typeof saveData) { writeData = writer; }

function persist(data: HabitTrackerData): void {
  if (!$dataReady.get()) return;
  $habitData.set(data);
  const result = writeData(data);
  $saveError.set(result.ok ? null : result.error);
}

/** Reemplaza todos los datos (usado al importar un respaldo JSON). */
export function replaceAllData(data: HabitTrackerData): void {
  persist(data);
}

export type NewHabitInput = Omit<Habit, "id" | "createdAt" | "archived">;

export function addHabit(input: NewHabitInput): Habit {
  const habit: Habit = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    archived: false,
  };
  const data = $habitData.get();
  persist({ ...data, habits: [...data.habits, habit] });
  return habit;
}

export function updateHabit(id: string, patch: Partial<Omit<Habit, "id">>): void {
  const data = $habitData.get();
  persist({
    ...data,
    habits: data.habits.map((habit) => (habit.id === id ? { ...habit, ...patch } : habit)),
  });
}

export function archiveHabit(id: string): void {
  updateHabit(id, { archived: true });
}

/**
 * Registra (o actualiza) el cumplimiento de un hábito para una fecha
 * dada (`YYYY-MM-DD`). Un valor <= 0 "desmarca" el día, eliminando el log
 * en vez de guardar un cero.
 */
export function logHabit(habitId: string, date: string, value: number): void {
  const data = $habitData.get();
  const existingIndex = data.logs.findIndex((log) => log.habitId === habitId && log.date === date);
  const logs = [...data.logs];

  if (value <= 0) {
    if (existingIndex !== -1) {
      logs.splice(existingIndex, 1);
    }
  } else if (existingIndex !== -1) {
    logs[existingIndex] = { ...logs[existingIndex], value };
  } else {
    logs.push({ habitId, date, value });
  }

  persist({ ...data, logs });
}

export function deleteHabit(id: string): void {
  const data = $habitData.get();
  persist({
    ...data,
    habits: data.habits.filter((habit) => habit.id !== id),
    logs: data.logs.filter((log) => log.habitId !== id),
  });
}

/** Checkpoints are declared evidence, never an automatic skill level. */
export function toggleLearningTask(pathId: string, taskId: string): void {
  const data = $habitData.get();
  const progress = data.learning?.[pathId];
  const path = learningPaths.find(p => p.id === pathId);
  const lesson = path?.stages.find(s => [...requiredSteps(s), lessonKey(s, 'checkpoint')].includes(taskId));
  if (!progress || !lesson) return;
  const removing = progress.completed.includes(taskId);
  if (!removing && taskId === lessonKey(lesson, 'checkpoint') && !canCompleteLesson(lesson, progress)) return;
  let completed = removing ? progress.completed.filter(id => id !== taskId) : [...progress.completed, taskId];
  if (removing && taskId !== lessonKey(lesson, 'checkpoint')) completed = completed.filter(id => id !== lessonKey(lesson, 'checkpoint'));
  persist({ ...data, learning: { ...data.learning, [pathId]: { ...progress, completed } } });
}

export function saveLearningNote(pathId: string, lessonId: string, note: string): void {
  const data = $habitData.get();
  const progress = data.learning?.[pathId];
  const lesson = learningPaths.find(p => p.id === pathId)?.stages.find(s => s.id === lessonId);
  if (!progress || !lesson) return;
  const completed = note.trim().length < 30 ? progress.completed.filter(id => id !== lessonKey(lesson, 'checkpoint')) : progress.completed;
  persist({ ...data, learning: { ...data.learning, [pathId]: { ...progress, completed, notes: { ...progress.notes, [lessonId]: note.slice(0, 12000) } } } });
}
