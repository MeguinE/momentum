import { createEmptyData, type HabitTrackerData } from '../storage/storage';

function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).filter(([,v])=>v!==undefined).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>[k,stable(v)]));
  return value;
}
export const same = (a: unknown, b: unknown): boolean => JSON.stringify(stable(a)) === JSON.stringify(stable(b));
type Records = Record<string, unknown>;
function records(data: HabitTrackerData): Records {
  const result: Records = { version: data.version, wellness: data.wellnessInitialized };
  for (const habit of data.habits) result['habit:' + habit.id] = habit;
  for (const log of data.logs) result['log:' + log.habitId + ':' + log.date] = log;
  for (const [id, progress] of Object.entries(data.learning ?? {})) result['learning:' + id] = progress;
  return result;
}
/** Three-way merge: deletions are changes too. Same-record conflicts require a choice. */
export function mergeProgress(base: HabitTrackerData, local: HabitTrackerData, remote: HabitTrackerData, prefer?: 'local' | 'remote') {
  const b = records(base), l = records(local), r = records(remote);
  const out: Records = {};
  const conflicts: string[] = [];
  for (const key of new Set([...Object.keys(b), ...Object.keys(l), ...Object.keys(r)])) {
    if (same(l[key], b[key])) out[key] = r[key];
    else if (same(r[key], b[key]) || same(l[key], r[key])) out[key] = l[key];
    else { conflicts.push(key); out[key] = prefer === 'remote' ? r[key] : l[key]; }
  }
  // A deletion conflicts with new work on that habit on the other device.
  for (const habit of base.habits) {
    const id = habit.id, key = 'habit:' + id;
    const localDeleted = !l[key], remoteDeleted = !r[key];
    if (localDeleted === remoteDeleted) continue;
    const other = localDeleted ? r : l;
    const changedChild = Object.keys(other).some(k =>
      (k.startsWith('log:' + id + ':') || (k.startsWith('learning:') && (other[k] as {habitId:string}).habitId === id))
      && !same(other[k], b[k]));
    if (changedChild) { conflicts.push(key); out[key] = prefer === 'remote' ? r[key] : l[key]; }
  }
  const data = createEmptyData();
  data.wellnessInitialized = out.wellness as boolean | undefined;
  data.habits = Object.entries(out).filter(([k,v]) => k.startsWith('habit:') && v !== undefined).map(([,v]) => v as HabitTrackerData['habits'][number]);
  const ids = new Set(data.habits.map(h => h.id));
  data.logs = Object.entries(out).filter(([k,v]) => k.startsWith('log:') && v !== undefined).map(([,v]) => v as HabitTrackerData['logs'][number]).filter(log => ids.has(log.habitId));
  const learning = Object.entries(out).filter(([k,v]) => k.startsWith('learning:') && v !== undefined);
  if (learning.length) data.learning = Object.fromEntries(learning.map(([k,v]) => [k.slice(9),v])) as HabitTrackerData['learning'];
  return { data, conflicts: [...new Set(conflicts)] };
}
