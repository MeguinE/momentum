import { BookOpen, Languages, CodeXml, Smile, Sparkles, Footprints, Heart, Droplets, Target, Timer, Check, type LucideIcon } from 'lucide-react';
import type { Habit } from '../../lib/types';
export const habitIcons: { id: string; label: string; icon: LucideIcon }[] = [
  {id:'book',label:'Lectura',icon:BookOpen},{id:'language',label:'Idiomas',icon:Languages},
  {id:'code',label:'Programación',icon:CodeXml},{id:'smile',label:'Cuidado dental',icon:Smile},
  {id:'sparkles',label:'Higiene',icon:Sparkles},{id:'walk',label:'Movimiento',icon:Footprints},
  {id:'heart',label:'Bienestar',icon:Heart},{id:'water',label:'Agua',icon:Droplets},{id:'target',label:'Objetivo',icon:Target},
];
export default function HabitIcon({habit,done=false}:{habit:Pick<Habit,'name'|'unit'|'color'|'icon'>;done?:boolean}) {
  const name = habit.name.toLocaleLowerCase('es');
  const automatic = /java|program|código/.test(name)?'code':/inglés|japonés|idioma/.test(name)?'language':/dental|dientes|cepill/.test(name)?'smile':/higiene|aseo|baño/.test(name)?'sparkles':/movimiento|caminar|ejercicio/.test(name)?'walk':/leer|lectura/.test(name)?'book':/agua/.test(name)?'water':'target';
  const Icon = habitIcons.find(i=>i.id===(habit.icon ?? automatic))?.icon ?? (habit.unit==='duration'?Timer:Target);
  return <span className={`habit-icon habit-art ${habit.color} ${done?'icon-complete':''}`} aria-hidden="true"><Icon size={22} strokeWidth={1.7}/>{done && <span className="habit-icon-check"><Check size={10}/></span>}</span>;
}
