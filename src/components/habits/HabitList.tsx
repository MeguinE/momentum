import { useStore } from '@nanostores/react';
import { useState } from 'react';
import { Pencil, Archive, RotateCcw, Trash2, Plus, CheckCircle2 } from 'lucide-react';
import type { Habit } from '../../lib/types';
import { $habitData, $saveError, addHabit, archiveHabit, deleteHabit, updateHabit, type NewHabitInput } from '../../lib/stores/habitsStore';
import HabitForm from './HabitForm';
import HabitIcon from './HabitIcon';

export default function HabitList() {
  const data = useStore($habitData);
  const saveError = useStore($saveError);
  const [mode,setMode] = useState<'hidden'|'create'|{editing:string}>(() => typeof location !== 'undefined' && new URLSearchParams(location.search).get('new') === '1' ? 'create' : 'hidden');
  const [notice,setNotice] = useState('');
  function submit(value:NewHabitInput) {
    if(typeof mode==='object') updateHabit(mode.editing,value);
    else addHabit(value);
    if ($saveError.get()) return;
    setMode('hidden'); setNotice('Cambios guardados');
  }
  function edit(habit:Habit) {setNotice('');setMode({editing:habit.id});}
  function card(habit:Habit) {
    const editing = typeof mode==='object' && mode.editing===habit.id;
    return <li key={habit.id} className={`glass habit-manager-card ${editing?'is-editing':''}`}>
      <div className="habit-manager-header"><div className="habit-info"><HabitIcon habit={habit}/><div><p className="font-medium">{habit.name}</p><p className="habit-meta">{habit.unit==='boolean'?'Un paso al día':`Meta diaria: ${habit.dailyGoal ?? 1} ${habit.unitLabel ?? ''}`}</p>{habit.why && <p className="habit-motivation">{habit.why}</p>}</div></div>
      <div className="habit-actions">
        <button type="button" onClick={()=>edit(habit)} aria-label={`Editar ${habit.name}`} aria-expanded={editing} className="edit-action"><Pencil size={15}/> Editar</button>
        <button type="button" aria-label={`${habit.archived?'Reactivar':'Archivar'} ${habit.name}`} title={habit.archived?'Reactivar':'Archivar'} onClick={()=>{habit.archived?updateHabit(habit.id,{archived:false}):archiveHabit(habit.id);setMode('hidden');}}>{habit.archived?<RotateCcw size={16}/>:<Archive size={16}/>}<span>{habit.archived?'Reactivar':'Archivar'}</span></button>
        <button type="button" aria-label={`Eliminar ${habit.name}`} title="Eliminar" className="delete-action" onClick={()=>{if(window.confirm(`¿Eliminar "${habit.name}"? Esto también borra su historial registrado.`)){deleteHabit(habit.id);setMode('hidden');}}}><Trash2 size={16}/><span>Eliminar</span></button>
      </div></div>
      {editing && <section className="inline-habit-editor" aria-label={`Edición de ${habit.name}`}><h3>Editar hábito</h3><HabitForm key={habit.id} initialValue={habit} onSubmit={submit} onCancel={()=>setMode('hidden')}/></section>}
    </li>;
  }
  const active = data.habits.filter(h=>!h.archived);
  const archived = data.habits.filter(h=>h.archived);
  return <div className="space-y-6">
    <div className="habit-list-toolbar"><button type="button" className="new-habit-button" onClick={()=>{setNotice('');setMode('create');}}><Plus size={18}/> Nuevo hábito</button><span>{active.length} activos · {archived.length} archivados</span></div>
    {notice && !saveError && <p role="status" className="habit-saved"><CheckCircle2 size={17}/>{notice}</p>}
    {saveError && <p role="alert">No se pudieron guardar los cambios. Intenta guardar otra vez o exporta un respaldo desde Ajustes.</p>}
    {mode==='create' && <section className="glass inline-habit-editor create-habit-editor" aria-label="Crear hábito"><h3>Nuevo hábito</h3><HabitForm key="create" onSubmit={submit} onCancel={()=>setMode('hidden')}/></section>}
    <section><h2 className="text-lg font-semibold">Activos</h2>{active.length===0?<p className="mt-2 text-zinc-500 dark:text-zinc-400">Todavía no hay hábitos. Crea uno para empezar.</p>:<ul className="habit-manager-list">{active.map(card)}</ul>}</section>
    {archived.length>0 && <section aria-label="Archivados"><h2 className="text-lg font-semibold">Archivados</h2><ul className="habit-manager-list">{archived.map(card)}</ul></section>}
  </div>;
}
