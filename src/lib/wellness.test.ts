import { describe, expect, it } from 'vitest';
import { initializeWellness } from './wellness';
import { initializeLearning } from './learning';
import { createEmptyData } from './storage/storage';
import { parseBackup, serializeBackup } from './storage/backup';
describe('wellness defaults', () => {
  it('adds three habits once without changing learning or history', () => {
    const original = initializeLearning(createEmptyData());
    original.logs.push({habitId:original.habits[0].id,date:'2026-10-25',value:5});
    const next = initializeWellness(original);
    expect(next.habits).toHaveLength(6);
    expect(next.habits.slice(0,3)).toEqual(original.habits);
    expect(next.logs).toEqual(original.logs);
    expect(next.learning).toEqual(original.learning);
    expect(initializeWellness(next)).toBe(next);
  });
  it('preserves matching existing habits including customized goals and archive state', () => {
    const data = createEmptyData();
    data.habits.push({id:'existing',name:'Movimiento diario',unit:'duration',unitLabel:'minutos',dailyGoal:10,color:'progress',createdAt:'2026-01-01',archived:true});
    const next = initializeWellness(data);
    expect(next.habits).toHaveLength(3);
    expect(next.habits[0]).toEqual(data.habits[0]);
  });
  it('does not recreate deleted defaults after exporting and importing', () => {
    const next = initializeWellness(createEmptyData());
    next.habits = [];
    const backup = parseBackup(serializeBackup(next));
    expect(backup.ok).toBe(true);
    if (backup.ok) expect(initializeWellness(backup.data).habits).toEqual([]);
  });
});
