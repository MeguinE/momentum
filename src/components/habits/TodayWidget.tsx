import { useState } from 'react';
import { useStore } from '@nanostores/react';
import { Check, Pencil, Undo2, ArrowUpRight } from 'lucide-react';
import HabitIcon from './HabitIcon';
import { $habitData, $saveError, logHabit } from '../../lib/stores/habitsStore';
import { useToday } from '../../lib/hooks/useToday';
import { calculateCurrentStreak, formatDateKey, getLogForDate, habitExistedOn } from '../../lib/utils/streak';
interface TodayWidgetProps { today?: Date }
interface LastChange { habitId:string; date:string; before:number; after:number; name:string }
export default function TodayWidget({today: selectedDate}:TodayWidgetProps) {
  const currentDate = useToday();
  const today = selectedDate ?? currentDate;
  const data = useStore($habitData);
  const error = useStore($saveError);
  const [last,setLast] = useState<LastChange|null>(null);
  const [editing,setEditing] = useState<{id:string;date:string;value:string}|null>(null);
  const [validation,setValidation] = useState('');
  const dateKey = formatDateKey(today);
  const habits = data.habits.filter(h=>!h.archived && habitExistedOn(h,today));
  function record(id:string,name:string,value:number) {
    const before = getLogForDate($habitData.get().logs,id,dateKey)?.value ?? 0;
    logHabit(id,dateKey,value);
    setLast({habitId:id,date:dateKey,before,after:value,name});
  }
  const undoable = last && last.date===dateKey && data.habits.some(h=>h.id===last.habitId) && (getLogForDate(data.logs,last.habitId,dateKey)?.value ?? 0)===last.after;
  if(!habits.length) return <p className="muted">Todavía no tienes hábitos. <a href="/habits?new=1" className="underline">Crea el primero</a>.</p>;
  return <div>
    {error ? <p role="alert" className="record-feedback">No se pudo guardar. Conserva un respaldo antes de cerrar.</p> : undoable && <div className="record-feedback"><span role="status"><Check size={15}/> Registro guardado: {last.name}</span><button onClick={()=>{logHabit(last.habitId,last.date,last.before);setLast(null);}}><Undo2 size={15}/> Deshacer</button></div>}
    <ul className="space-y-3">{habits.map(habit=>{
      const value=getLogForDate(data.logs,habit.id,dateKey)?.value ?? 0;
      const goal=habit.unit==='boolean'?1:habit.dailyGoal ?? 1;
      const done=value>=goal;
      const path=Object.entries(data.learning ?? {}).find(([,p])=>p.habitId===habit.id)?.[0];
      const editor=editing?.id===habit.id && editing.date===dateKey;
      return <li key={habit.id} className={`glass habit-row daily-habit ${done?'habit-done':''}`}>
        <div className="daily-habit-main"><div className="habit-info"><HabitIcon habit={habit} done={done}/><div><p className="font-medium">{habit.name}</p><p className="habit-streak">Racha: {calculateCurrentStreak(habit,data.logs,today)} <span>· {done?'Meta cumplida':'Un paso más'}</span></p>{path && <a className="study-shortcut" href={`/learning?path=${encodeURIComponent(path)}`}>Continuar aprendizaje <ArrowUpRight size={12}/></a>}</div></div>
        {habit.unit==='boolean'?<label className={`done-control ${done?'is-done':''}`}><input type="checkbox" aria-label={habit.name} checked={done} onChange={e=>record(habit.id,habit.name,e.target.checked?1:0)}/><span>{done?'Hecho':'Marcar hecho'}</span></label>:<div className="habit-controls"><span>{value} / {goal} {habit.unitLabel ?? ''}</span>{habit.unit==='duration'?<button className="daily-add" aria-label={`+5 a ${habit.name}`} onClick={()=>record(habit.id,habit.name,value+5)}>+5 min</button>:<button className="daily-add" aria-label={`+1 a ${habit.name}`} onClick={()=>record(habit.id,habit.name,value+1)}>+1</button>}<button className="correct-value" aria-label={`Corregir cantidad de ${habit.name}`} aria-expanded={editor} onClick={()=>{setEditing(editor?null:{id:habit.id,date:dateKey,value:String(value)});setValidation('');}}><Pencil size={14}/><span>Corregir</span></button></div>}</div>
        {habit.unit!=='boolean' && <div className="habit-meter" role="progressbar" aria-label={`Progreso de ${habit.name}`} aria-valuemin={0} aria-valuemax={goal} aria-valuenow={Math.min(value,goal)} aria-valuetext={`${value} de ${goal} ${habit.unitLabel ?? ''}`}><span style={{width:`${Math.min(100,value/goal*100)}%`}}/></div>}
        {editor && <form className="quantity-editor" onSubmit={e=>{e.preventDefault();const amount=Number(editing.value);if(!editing.value.trim() || !Number.isFinite(amount) || amount<0){setValidation('Escribe una cantidad igual o mayor que cero.');return;}record(habit.id,habit.name,amount);setEditing(null);}} noValidate><label>Total registrado<input autoFocus aria-label={`Total de ${habit.name}`} type="number" min="0" step="any" value={editing.value} onChange={e=>{setEditing({...editing,value:e.target.value});setValidation('');}}/></label><button type="submit">Guardar total</button><button type="button" onClick={()=>setEditing(null)}>Cancelar</button><small>Reemplaza el total del día. Usa 0 para quitar el registro.</small>{validation && <p role="alert">{validation}</p>}</form>}
      </li>;
    })}</ul>
  </div>;
}
