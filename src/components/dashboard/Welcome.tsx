import { useStore } from '@nanostores/react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { $habitData } from '../../lib/stores/habitsStore';
import { computeDashboardSummary } from '../../lib/utils/dashboard';
export default function Welcome() {
  const data = useStore($habitData);
  const today = new Date();
  const summary = computeDashboardSummary(data.habits, data.logs, today);
  const percent = summary.totalActive ? Math.round(summary.completedToday / summary.totalActive * 100) : 0;
  return <><div className="page-intro"><div><p className="eyebrow">{today.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}</p><h1>Hoy es un buen día<br className="mobile-break"/> para <em>avanzar.</em></h1><p className="muted">Un poco más cerca de la persona que quieres ser.</p></div><a className="secondary-button" href="/habits">+ Nuevo hábito</a></div><section className="hero"><div className="hero-copy"><span className="hero-tag"><Sparkles size={14}/> TU MEJOR INVERSIÓN ERES TÚ</span><h2>Pequeños pasos.<br/>Posibilidades enormes.</h2><p>Aprende una palabra. Escribe una línea de código.<br/>Dale a tu futuro un poquito de tu presente.</p><a href="#today" className="hero-button">Vamos con lo de hoy <ArrowRight size={17}/></a></div><div className="hero-orbit" aria-label={`${percent}% de hábitos completados hoy`}><div className="orbit orbit-one"/><div className="orbit orbit-two"/><span className="orbit-dot dot-one"/><span className="orbit-dot dot-two"/><div className="daily-ring" style={{background: `conic-gradient(#d6f5a1 ${percent}%, #ffffff18 0)`}}><div><span>MI PROGRESO DE HOY</span><strong>{percent}<small>%</small></strong><p>{summary.completedToday} de {summary.totalActive} hábitos</p></div></div><span className="orbit-label label-one">あ · aprender</span><span className="orbit-label label-two">&lt;/&gt; · construir</span></div></section></>;
}
