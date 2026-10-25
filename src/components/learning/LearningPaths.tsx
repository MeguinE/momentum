import { useState, useEffect, useRef } from 'react';
import { useStore } from '@nanostores/react';
import { ArrowUpRight, ArrowRight, Check, BookOpen, Clock3, RotateCcw, FileText, ChevronLeft } from 'lucide-react';
import { learningPaths, pathSummary, lessonKey, isLessonComplete, canCompleteLesson } from '../../lib/learning';
import type { LearningPath, Lesson } from '../../lib/curriculum/types';
import { $habitData, $saveError, toggleLearningTask, updateHabit, addHabit, replaceAllData, saveLearningNote } from '../../lib/stores/habitsStore';

export default function LearningPaths({ compact = false }: { compact?: boolean }) {
  const data = useStore($habitData);
  const [selected, setSelected] = useState('english');
  const path = learningPaths.find(p => p.id === selected)!;
  useEffect(() => {
    if (compact) return;
    const selectFromUrl = () => { const id = new URLSearchParams(location.search).get('path'); if (learningPaths.some(p => p.id === id)) setSelected(id!); };
    selectFromUrl(); window.addEventListener('popstate', selectFromUrl);
    return () => window.removeEventListener('popstate', selectFromUrl);
  }, [compact]);
  function select(id: string) { setSelected(id); const url = new URL(location.href); url.searchParams.set('path', id); history.replaceState(null, '', url); }
  return <div>
    <div className="path-grid">{learningPaths.map(p => {
      const summary = pathSummary(p, data.learning?.[p.id]);
      const habit = data.habits.find(h => h.id === data.learning?.[p.id]?.habitId);
      const goal = !habit || habit.archived ? 'Hábito pausado' : habit.unit === 'boolean' ? 'Meta diaria: completar' : `${habit.dailyGoal ?? 1} ${habit.unitLabel ?? 'unidades'} / día`;
      const content = <><div className="path-card-top"><span className={`path-symbol ${p.id}`}>{p.symbol}</span><ArrowUpRight size={19}/></div><p className="eyebrow">{p.level}</p><h3>{p.title}</h3><p className="muted">{p.subtitle}</p><div className="path-progress"><span>Plan documentado · {summary.complete}/{summary.total}</span><b>{summary.percent}%</b></div><div className="progress-track"><span style={{width:`${summary.percent}%`}}/></div><div className="path-footer"><span><BookOpen size={14}/> {p.stages.length} módulos</span><span><Clock3 size={14}/> {goal}</span></div></>;
      return compact ? <a key={p.id} className={`path-card ${p.id}`} href={`/learning?path=${p.id}`}>{content}</a> : <button key={p.id} className={`path-card ${p.id} ${selected === p.id ? 'selected' : ''}`} aria-pressed={selected === p.id} onClick={() => select(p.id)}>{content}</button>;
    })}</div>
    {!compact && <StudyPlan key={path.id} path={path}/>}
  </div>;
}
function StudyPlan({ path }: { path: LearningPath }) {
  const data = useStore($habitData);
  const progress = data.learning?.[path.id];
  const summary = pathSummary(path, progress);
  const [lessonId, setLessonId] = useState(() => summary.next?.id ?? path.stages[0].id);
  const lesson = path.stages.find(s => s.id === lessonId) ?? path.stages[0];
  const index = path.stages.indexOf(lesson);
  const habit = data.habits.find(h => h.id === progress?.habitId);
  const panel = useRef<HTMLDivElement>(null);
  function choose(id: string) { setLessonId(id); requestAnimationFrame(() => panel.current?.scrollIntoView({behavior:'auto',block:'start'})); }
  function restore() {
    if (!progress) return;
    if (habit) updateHabit(habit.id, { archived:false });
    else {
      const added = addHabit({name:`Aprender ${path.title.toLowerCase()}`,unit:'duration',unitLabel:'minutos',dailyGoal:path.minutes,color:path.color});
      const current = $habitData.get();
      replaceAllData({...current,learning:{...current.learning,[path.id]:{...progress,habitId:added.id}}});
    }
  }
  const legacy = progress?.completed.filter(id => !id.startsWith('v2:')) ?? [];
  return <section className="study-plan" aria-label={`Ruta de ${path.title}`}>
    <div className="study-intro glass">
      <div className="section-heading"><div><p className="eyebrow">UN PLAN PARA ESTUDIAR, NO SOLO PARA MARCAR</p><h2>Aprender {path.title}, paso a paso</h2></div><span className={`path-symbol ${path.id}`}>{path.symbol}</span></div>
      <p className="muted">{path.intro}</p>
      <div className="study-facts"><span><BookOpen size={16}/>{summary.total} módulos</span><span><Clock3 size={16}/>{summary.hours[0]}–{summary.hours[1]} horas estimadas de trabajo</span><span>Sin fecha límite</span></div>
      <p className="study-scope">{path.scope} Las horas son una estimación del plan, no un plazo para dominar la materia.</p>
      <details className="study-method"><summary>Cómo estudiar y compatibilizarlo con tus hábitos</summary><ol>{path.routine.map(s => <li key={s}>{s}</li>)}</ol><p>Registra únicamente los minutos que realmente estudiaste en Mi día. Leer, marcar actividades o cerrar un módulo aquí no suma minutos ni cambia tus rachas. Tus metas siguen siendo editables en Hábitos.</p></details>
      {legacy.length > 0 && <p className="legacy-notice">Conservamos {legacy.length} marcas de la ruta anterior en tu respaldo. Como estas lecciones son nuevas, esas marcas no las aprueban automáticamente. Tus hábitos y minutos siguen intactos.</p>}
      {(!habit || habit.archived) && <div className="learning-notice">El hábito está {habit ? 'archivado' : 'eliminado'}. Puedes seguir usando el plan.<button className="primary-button" onClick={restore}>Reactivar hábito</button></div>}
      {summary.next ? <button className="resume-lesson" onClick={() => choose(summary.next!.id)}><span><small>SIGUIENTE MÓDULO SIN CERRAR</small>{summary.next.title}</span><ArrowRight size={20}/></button> : <p className="learning-notice">Documentaste todos los módulos. Conserva tus repasos y busca evaluación externa; este resultado no asigna un nivel.</p>}
    </div>
    <div className="curriculum-layout">
      <nav className="curriculum-index glass" aria-label={`Módulos de ${path.title}`}><h3>Tu itinerario</h3><p>Explora cualquier módulo. El orden sugerido construye sobre lo anterior.</p>{path.stages.map((s,i) => <div key={s.id}>{(i===0 || path.stages[i-1].phase !== s.phase) && <h4>{s.phase}</h4>}<button aria-current={s.id===lesson.id?'step':undefined} onClick={() => choose(s.id)}><span className="module-state">{isLessonComplete(s,progress)?<Check size={14}/>:String(i+1).padStart(2,'0')}</span><span>{s.title}<small>{s.hours[0]}–{s.hours[1]} h · {isLessonComplete(s,progress)?'documentado':'por trabajar'}</small></span></button></div>)}</nav>
      <div ref={panel} className="lesson-anchor"><LessonView key={`${path.id}:${lesson.id}`} path={path} lesson={lesson} index={index}/><div className="lesson-navigation"><button disabled={index===0} onClick={() => choose(path.stages[index-1].id)}><ChevronLeft size={16}/> Anterior</button><span>{index+1} / {path.stages.length}</span><button disabled={index===path.stages.length-1} onClick={() => choose(path.stages[index+1].id)}>Siguiente <ArrowRight size={16}/></button></div></div>
    </div>
  </section>;
}
function LessonView({path,lesson,index}:{path:LearningPath;lesson:Lesson;index:number}) {
  const data = useStore($habitData);
  const saveError = useStore($saveError);
  const progress = data.learning?.[path.id];
  const done = isLessonComplete(lesson,progress);
  const ready = canCompleteLesson(lesson,progress);
  const note = progress?.notes?.[lesson.id] ?? '';
  function check(step:string,label:string) { return <label className="study-check"><input type="checkbox" checked={progress?.completed.includes(lessonKey(lesson,step)) ?? false} onChange={() => toggleLearningTask(path.id,lessonKey(lesson,step))}/><span>{label}</span></label>; }
  return <article className="lesson-panel glass" aria-label={`Lección: ${lesson.title}`}>
    <p className="eyebrow">MÓDULO {String(index+1).padStart(2,'0')} · {lesson.phase}</p><h2>{lesson.title}</h2><p className="lesson-goal">{lesson.goal}</p><p className="lesson-duration">{lesson.hours[0]}–{lesson.hours[1]} horas, repartidas en varias sesiones. Repite lo necesario.</p>
    {index>0 && <p className="lesson-prerequisite">Antes de empezar: poder resolver el reto de «{path.stages[index-1].title}». Puedes explorar libremente y volver a reforzarlo.</p>}
    <section className="lesson-section"><h3>1. Entiende la idea</h3><p>{lesson.explanation}</p><pre className="lesson-example">{lesson.example}</pre></section>
    <section className="lesson-section"><h3>2. Estudia con material</h3><p className="muted">Abre estos recursos y sigue la indicación. Abrir un enlace no marca el material como estudiado.</p><div className="lesson-resources">{lesson.resources.map((res,i) => <div className="lesson-resource" key={`${res.url}-${i}`}><a href={res.url} target="_blank" rel="noreferrer">{res.title}<ArrowUpRight size={16}/></a><small>{res.language}</small><p>{res.instruction}</p></div>)}</div>{check('material','Trabajé el material indicado y anoté lo que no entendí.')}</section>
    <section className="lesson-section"><h3>3. Practica, produce y corrige</h3><ol className="practice-list">{lesson.practice.map(task=><li key={task}>{task}</li>)}</ol><div className="mini-exercise"><strong>Prueba antes de mirar la solución</strong><p>{lesson.exercise.prompt}</p><details><summary>Ver explicación de la respuesta</summary><p>{lesson.exercise.answer}</p></details></div>{check('practice','Realicé las prácticas y corregí mis errores; no solo leí la solución.')}</section>
    <section className="lesson-section"><h3>4. Vuelve a intentarlo otro día</h3><p>{lesson.review}</p>{check('recall','Volví a intentarlo en otra sesión, sin copiar mis respuestas anteriores.')}</section>
    <section className="lesson-section"><h3>5. Comprueba y guarda evidencia</h3><div className="lesson-deliverable"><FileText size={18}/><p>{lesson.deliverable}</p></div><p className="muted">Autoevaluación: marca solo lo que puedes demostrar. La app no califica tu pronunciación, textos ni código.</p><div className="criteria-list">{lesson.criteria.map((criterion,i)=><div key={criterion}>{check(`criterion-${i}`,criterion)}</div>)}</div><label className="evidence-label" htmlFor={`evidence-${lesson.id}`}>Mi evidencia y lo que debo reforzar</label><textarea id={`evidence-${lesson.id}`} value={note} maxLength={12000} onChange={event=>saveLearningNote(path.id,lesson.id,event.target.value)} rows={6} placeholder="Fecha y trabajo realizado. Resultado antes de corregir. Errores y cambios. Nombre de archivo o enlace a mi trabajo. Feedback recibido o evaluación pendiente."/><p className="evidence-status" role="status">{saveError ? 'No se pudo guardar. Exporta un respaldo antes de cerrar.' : note ? 'Nota guardada en este navegador e incluida en tus respaldos.' : 'Escribe una evidencia concreta (mínimo 30 caracteres). No se suben archivos.'}</p>
    <button className={`finish-lesson ${done?'finished':''}`} disabled={!progress || (!done && !ready)} onClick={()=>toggleLearningTask(path.id,lessonKey(lesson,'checkpoint'))}>{done?<><RotateCcw size={17}/> Reabrir módulo para repasar</>:<><Check size={17}/> Cerrar módulo con mi evidencia</>}</button><p className="checkpoint-help">{done?'Módulo documentado por ti. Esto no acredita un nivel.':ready?'Puedes documentar el módulo. Esta confirmación es tu autoevaluación.':'Para cerrar: completa material, práctica, repaso, los tres criterios y una nota de al menos 30 caracteres.'}</p></section>
  </article>;
}
