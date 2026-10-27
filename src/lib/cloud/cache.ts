import { isHabitTrackerData, type HabitTrackerData } from '../storage/storage';
export interface Snapshot { data: HabitTrackerData; revision: number }
export interface Cache { base: Snapshot; local: HabitTrackerData }
export function validData(value: unknown): value is HabitTrackerData {
  if (!isHabitTrackerData(value) || value.version !== 1) return false;
  return value.habits.every(h => h && typeof h.id === 'string' && typeof h.name === 'string' && typeof h.createdAt === 'string' && ['boolean','count','duration'].includes(h.unit) && typeof h.color === 'string')
    && value.logs.every(l => l && typeof l.habitId === 'string' && typeof l.date === 'string' && typeof l.value === 'number' && Number.isFinite(l.value) && l.value >= 0);
}
export function validSnapshot(value: unknown): value is Snapshot {
  const s = value as Snapshot | null;
  return !!s && Number.isSafeInteger(s.revision) && s.revision >= 0 && validData(s.data);
}
export function cacheKey(user: string) { return 'momentum:cloud:' + user; }
export function readCache(user: string): Cache | null {
  const raw = localStorage.getItem(cacheKey(user));
  if (!raw) return null;
  const value = JSON.parse(raw) as Cache;
  if (!validSnapshot(value.base) || !validData(value.local)) throw new Error('Copia local inválida. Exporta un respaldo antes de continuar.');
  return value;
}
export function writeCache(user: string, cache: Cache) {
  localStorage.setItem(cacheKey(user), JSON.stringify(cache));
}
