import { useStore } from '@nanostores/react';
import { UserRound } from 'lucide-react';
import { $cloud } from '../../lib/cloud/sync';
export default function ProfileLink({ compact=false }: {compact?:boolean}) {
  const {email} = useStore($cloud);
  const name = email?.split('@')[0];
  return <a className={compact?'profile-link compact':'profile-link'} href="/profile" aria-label={email ? `Mi perfil: ${email}` : 'Mi perfil e iniciar sesión'} title={email ?? 'Mi perfil'}>
    <span className="profile-avatar" aria-hidden="true">{name ? name.slice(0,2).toUpperCase() : <UserRound size={20}/>}</span>
    {!compact && <span className="profile-identity"><strong>{name ?? 'Mi perfil'}</strong><small>{email ?? 'Conectar mis dispositivos'}</small></span>}
  </a>;
}
