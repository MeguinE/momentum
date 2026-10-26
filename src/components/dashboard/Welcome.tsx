import { useStore } from '@nanostores/react';
import { CheckCircle2, Sprout } from 'lucide-react';
import { $habitData } from '../../lib/stores/habitsStore';
import { computeDashboardSummary } from '../../lib/utils/dashboard';
import { useToday } from '../../lib/hooks/useToday';
export default function Welcome() {
  const data = useStore($habitData);
  const today = useToday();
  const summary = computeDashboardSummary(data.habits, data.logs, today);
  const remaining = summary.totalActive - summary.completedToday;
  const percent = summary.totalActive ? Math.round(summary.completedToday / summary.totalActive * 100) : 0;
  return <><div className="page-intro daily-intro"><div><p className="eyebrow">{today.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}</p><h1>Un paso a la <em>vez.</em></h1><p className="muted">{summary.totalActive === 0 ? 'Elige un hábito pequeño para empezar.' : remaining === 0 ? 'Ya cumpliste tus metas de hoy. Disfruta lo que avanzaste.' : 'Elige por dónde empezar. Cada avance cuenta.'}</p></div><a className="secondary-button" href="/habits?new=1">+ Nuevo hábito</a></div><div className="daily-focus"><span className="daily-focus-icon">{remaining===0 && summary.totalActive>0?<CheckCircle2 size={24}/>:<Sprout size={24}/>}</span><div><strong>{summary.totalActive===0?'Tu espacio está listo':`${summary.completedToday} de ${summary.totalActive} hábitos completados`}</strong><p>{remaining>0?`${remaining} ${remaining===1?'pendiente':'pendientes'} · a tu ritmo`:'Un pequeño paso hoy también cuenta.'}</p></div><div className="daily-meter" role="progressbar" aria-label="Hábitos completados hoy" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}><span style={{width:`${percent}%`}}/></div></div></>;
}
