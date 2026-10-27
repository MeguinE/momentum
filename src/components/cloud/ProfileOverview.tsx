import { useStore } from '@nanostores/react';
import { UserRound, ShieldCheck, HardDrive } from 'lucide-react';
import { $cloud } from '../../lib/cloud/sync';
import { $habitData } from '../../lib/stores/habitsStore';
export default function ProfileOverview() {
  const {email} = useStore($cloud), data = useStore($habitData);
  const name = email?.split('@')[0];
  return <section className="profile-overview glass" aria-label="Resumen de mi perfil">
    <div className="profile-heading"><span className="profile-avatar" aria-hidden="true">{name ? name.slice(0,2).toUpperCase() : <UserRound size={30}/>}</span><div><p className="eyebrow">{email?'MI CUENTA':'MODO LOCAL'}</p><h2>{name ?? 'Tu espacio personal'}</h2><p>{email ?? 'Inicia sesión para llevar tu progreso contigo.'}</p></div></div>
    <div className="profile-totals"><span><strong>{data.habits.filter(h=>!h.archived).length}</strong> hábitos activos</span><span><strong>{data.logs.length}</strong> registros guardados</span></div>
    <p className="profile-storage">{email?<ShieldCheck size={16}/>:<HardDrive size={16}/>} {email?'Estos datos pertenecen a tu cuenta. Consulta abajo si hay cambios pendientes de sincronizar.':'Tu progreso está en este navegador. Puedes vincularlo al iniciar sesión.'}</p>
  </section>;
}
