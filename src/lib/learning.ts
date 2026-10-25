import type { HabitTrackerData } from './storage/storage';
import type { LearningPath, Lesson } from './curriculum/types';
import { english } from './curriculum/english';
import { japanese } from './curriculum/japanese';
import { java } from './curriculum/java';
export const learningPaths: LearningPath[] = [english, japanese, java];
export function lessonKey(lesson: Lesson, step: string): string { return `v2:${lesson.id}:${step}`; }
export function requiredSteps(lesson: Lesson): string[] {
  return ['material', 'practice', 'recall', ...lesson.criteria.map((_, i) => `criterion-${i}`)].map(step => lessonKey(lesson, step));
}
export function canCompleteLesson(lesson: Lesson, progress?: LearningProgress): boolean {
  return !!progress && requiredSteps(lesson).every(id => progress.completed.includes(id)) && (progress.notes?.[lesson.id]?.trim().length ?? 0) >= 30;
}
export function isLessonComplete(lesson: Lesson, progress?: LearningProgress): boolean {
  return canCompleteLesson(lesson, progress) && !!progress?.completed.includes(lessonKey(lesson, 'checkpoint'));
}
export function pathSummary(path: LearningPath, progress?: LearningProgress) {
  const complete = path.stages.filter(lesson => isLessonComplete(lesson, progress)).length;
  return { complete, total: path.stages.length, percent: Math.round(complete / path.stages.length * 100), next: path.stages.find(lesson => !isLessonComplete(lesson, progress)), hours: path.stages.reduce((total, s) => [total[0] + s.hours[0], total[1] + s.hours[1]], [0, 0]) };
}

export interface LearningProgress {
  habitId: string;
  completed: string[];
  /** Written evidence is self-reported, never automatically graded. */
  notes?: Record<string, string>;
}
export function initializeLearning(data: HabitTrackerData): HabitTrackerData {
  if (data.learning) return data;
  const habits = [...data.habits];
  const learning: Record<string, LearningProgress> = {};
  for (const path of learningPaths) {
    const name = `Aprender ${path.title.toLowerCase()}`;
    const existing = habits.find(h => h.name.trim().toLowerCase() === name.toLowerCase() && h.unit === 'duration' && h.unitLabel === 'minutos');
    const id = existing?.id ?? crypto.randomUUID();
    if (!existing) habits.push({ id, name, why: path.subtitle, unit: 'duration', unitLabel: 'minutos', dailyGoal: path.minutes, color: path.color, createdAt: new Date().toISOString(), archived: false });
    learning[path.id] = { habitId: id, completed: [] };
  }
  return { ...data, habits, learning };
}
