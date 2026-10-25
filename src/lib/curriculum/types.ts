export interface Resource { title: string; url: string; instruction: string; language: string }
export interface Lesson {
  id: string;
  title: string;
  phase: string;
  hours: [number, number];
  goal: string;
  explanation: string;
  example: string;
  resources: Resource[];
  practice: string[];
  exercise: { prompt: string; answer: string };
  deliverable: string;
  criteria: string[];
  review: string;
}
export interface LearningPath {
  id: string; title: string; symbol: string; subtitle: string; level: string;
  minutes: number; color: string; intro: string; routine: string[];
  scope: string; stages: Lesson[];
}
export function resource(title: string, url: string, instruction: string, language = 'Inglés; guía de trabajo en español aquí'): Resource {
  return { title, url, instruction, language };
}
