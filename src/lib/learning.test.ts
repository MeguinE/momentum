import { beforeEach, describe, expect, it } from 'vitest';
import { initializeLearning, learningPaths, lessonKey, requiredSteps, pathSummary, canCompleteLesson, isLessonComplete } from './learning';
import { createEmptyData, isHabitTrackerData, loadData } from './storage/storage';
import { $habitData, replaceAllData, toggleLearningTask, archiveHabit, deleteHabit, saveLearningNote } from './stores/habitsStore';
import { parseBackup, serializeBackup } from './storage/backup';
const first = learningPaths[0].stages[0];
const note = '2026-10-25: practiqué un diálogo, corregí saludos y necesito repasar la pronunciación.';
beforeEach(() => { localStorage.clear(); $habitData.set(createEmptyData()); });
describe('learning integration', () => {
  it('adds paths once and preserves existing habits and logs', () => {
    const old = { ...createEmptyData(), habits: [{id:'reading', name:'Leer', unit:'boolean' as const, color:'progress', createdAt:'2026-01-01', archived:false}], logs: [{habitId:'reading',date:'2026-10-24',value:1}] };
    const next = initializeLearning(old);
    expect(next.habits).toHaveLength(4);
    expect(next.habits[0]).toEqual(old.habits[0]);
    expect(next.logs).toEqual(old.logs);
    expect(initializeLearning(next)).toBe(next);
  });
  it('reuses a matching study habit without changing its goal or archive state', () => {
    const old = {...createEmptyData(), habits:[{id:'en',name:'Aprender inglés',unit:'duration' as const,unitLabel:'minutos',dailyGoal:7,color:'progress',createdAt:'2026-01-01',archived:true}]};
    const next = initializeLearning(old);
    expect(next.habits).toHaveLength(3);
    expect(next.learning?.english.habitId).toBe('en');
    expect(next.habits[0]).toEqual(old.habits[0]);
  });
  it('persists practice without adding study minutes and supports undo', () => {
    replaceAllData(initializeLearning(createEmptyData()));
    toggleLearningTask('english',lessonKey(first,'material'));
    expect(loadData().learning?.english.completed).toEqual([lessonKey(first,'material')]);
    expect($habitData.get().logs).toEqual([]);
    toggleLearningTask('english',lessonKey(first,'material'));
    expect($habitData.get().learning?.english.completed).toEqual([]);
  });
  it('requires material, practice, recall, criteria and evidence to close a module', () => {
    replaceAllData(initializeLearning(createEmptyData()));
    const checkpoint = lessonKey(first,'checkpoint');
    toggleLearningTask('english',checkpoint);
    expect($habitData.get().learning!.english.completed).not.toContain(checkpoint);
    for (const step of requiredSteps(first)) toggleLearningTask('english',step);
    expect(canCompleteLesson(first,$habitData.get().learning!.english)).toBe(false);
    saveLearningNote('english',first.id,note);
    toggleLearningTask('english',checkpoint);
    expect(isLessonComplete(first,$habitData.get().learning!.english)).toBe(true);
    expect(pathSummary(learningPaths[0],$habitData.get().learning!.english).complete).toBe(1);
    toggleLearningTask('english',lessonKey(first,'recall'));
    expect(isLessonComplete(first,$habitData.get().learning!.english)).toBe(false);
    expect($habitData.get().learning!.english.completed).not.toContain(checkpoint);
    expect($habitData.get().logs).toEqual([]);
  });
  it('reopens a module when evidence is removed', () => {
    replaceAllData(initializeLearning(createEmptyData()));
    for (const step of requiredSteps(first)) toggleLearningTask('english',step);
    saveLearningNote('english',first.id,note);
    toggleLearningTask('english',lessonKey(first,'checkpoint'));
    saveLearningNote('english',first.id,'');
    expect(isLessonComplete(first,loadData().learning!.english)).toBe(false);
  });
  it('preserves legacy marks without assigning them to different lessons', () => {
    const old = initializeLearning(createEmptyData());
    old.learning!.english.completed = ['0-0','0-1','0-2','0-3','unknown'];
    replaceAllData(old);
    expect(initializeLearning(old)).toBe(old);
    expect(pathSummary(learningPaths[0],old.learning!.english).percent).toBe(0);
    expect(loadData().learning!.english.completed).toEqual(old.learning!.english.completed);
  });
  it('preserves notes and archived/deleted habit state across backup roundtrip', () => {
    replaceAllData(initializeLearning(createEmptyData()));
    saveLearningNote('english',first.id,note);
    const data = $habitData.get();
    archiveHabit(data.learning!.english.habitId);
    deleteHabit(data.learning!.java.habitId);
    const next = initializeLearning($habitData.get());
    expect(next.habits).toHaveLength(2);
    expect(next.habits.find(h => h.id === data.learning!.english.habitId)?.archived).toBe(true);
    expect(next.learning!.english.notes?.[first.id]).toBe(note);
    expect(parseBackup(serializeBackup(next))).toEqual({ok:true,data:next});
  });
  it('accepts old backups and rejects malformed progress and notes', () => {
    expect(parseBackup(serializeBackup(createEmptyData())).ok).toBe(true);
    expect(isHabitTrackerData({...createEmptyData(),learning:{english:{completed:'invalid'}}})).toBe(false);
    expect(isHabitTrackerData({...createEmptyData(),learning:{english:{habitId:'x',completed:[],notes:{foo:42}}}})).toBe(false);
  });
  it('has unique stable lesson IDs and actionable material for every module', () => {
    const ids = learningPaths.flatMap(p=>p.stages.map(s=>s.id));
    expect(new Set(ids).size).toBe(ids.length);
    for (const path of learningPaths) for (const lesson of path.stages) {
      expect(lesson.resources.length).toBeGreaterThan(0);
      expect(lesson.practice.length).toBeGreaterThanOrEqual(3);
      expect(lesson.criteria).toHaveLength(3);
      expect(lesson.hours[1]).toBeGreaterThanOrEqual(lesson.hours[0]);
      for (const resource of lesson.resources) expect(new URL(resource.url).protocol).toBe('https:');
    }
  });
});
