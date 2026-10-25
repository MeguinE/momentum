import type { HabitTrackerData } from './storage/storage';
import type { Habit } from './types';

/** One-time defaults, independent of learning progress. Never restores deleted habits. */
export function initializeWellness(data: HabitTrackerData): HabitTrackerData {
  if (data.wellnessInitialized) return data;
  const defaults: Omit<Habit, 'id' | 'createdAt' | 'archived'>[] = [
    { name: 'Cepillado dental', unit: 'count', unitLabel: 'cepillados', dailyGoal: 2, color: 'progress', why: 'Mañana y noche: dos minutos por cepillado con pasta con flúor.' },
    { name: 'Higiene personal', unit: 'boolean', color: 'success', why: 'Completar mi rutina de aseo corporal y cambiar la ropa interior; adaptar el baño a mis necesidades.' },
    { name: 'Movimiento diario', unit: 'duration', unitLabel: 'minutos', dailyGoal: 20, color: 'achievement', why: 'Caminar o realizar una actividad que disfrute. Meta inicial ajustable a mi ritmo; puedo repartirla durante el día.' },
  ];
  const habits = [...data.habits];
  for (const input of defaults) {
    const exists = habits.some(h => h.name.trim().toLocaleLowerCase('es') === input.name.toLocaleLowerCase('es'));
    if (!exists) habits.push({ ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString(), archived: false });
  }
  return { ...data, habits, wellnessInitialized: true };
}
