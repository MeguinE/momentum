import { useState, type SubmitEvent } from 'react';
import { useStore } from '@nanostores/react';
import { Cloud, RefreshCw, LogOut, Mail } from 'lucide-react';
import { cloudConfigured, getCloudClient } from '../../lib/cloud/client';
import { $cloud, synchronize, signOut, retryConnection } from '../../lib/cloud/sync';
export default function AccountPanel() {
  const state = useStore($cloud);
  const [email,setEmail] = useState('');
  const [busy,setBusy] = useState(false);
  const [message,setMessage] = useState('');
  const [error,setError] = useState('');
  async function login(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      const {error} = await getCloudClient()!.auth.signInWithOtp({email:email.trim(),options:{emailRedirectTo:location.origin+'/profile'}});
      if(error) throw error;
      setMessage('Revisa tu correo y abre el enlace en este dispositivo. Usa el mismo correo en tu celular y tu laptop.');
    } catch { setError('No se pudo enviar el enlace. Verifica el correo, espera un minuto y vuelve a intentarlo.'); }
    finally { setBusy(false); }
  }
  async function logout() {
    setBusy(true); setError('');
    try { await signOut(); }
    catch (e) { setError(e instanceof Error ? e.message : 'No se pudo cerrar sesión.'); }
    finally {setBusy(false);}
  }
  return <section id="account" className="account-panel glass">
    <h2><Cloud size={22}/> Cuenta y sincronización</h2>
    {!cloudConfigured ? <p>La conexión a Supabase aún no está configurada. Tus hábitos siguen guardándose en este navegador.</p>
    : state.email ? <>
      <p>Sesión iniciada como <strong>{state.email}</strong></p>
      <p role="status">{state.phase==='ready'?'Tu progreso está sincronizado.':state.message ?? (state.phase==='pending'?'Tienes cambios pendientes de enviar.':'Guardando y comprobando cambios…')}</p>
      {state.lastSync && <p className="muted">Última sincronización: {new Date(state.lastSync).toLocaleTimeString('es-MX')}</p>}
      <p>Al cargar se recuperan los avances de la nube y se envían los cambios pendientes de este dispositivo. Si pierdes conexión, los cambios quedan pendientes en este navegador y se envían al volver.</p>
      <div className="account-actions"><button onClick={()=>void synchronize()} disabled={busy || state.phase==='syncing'}><RefreshCw size={16}/> Cargar y sincronizar</button><button className="secondary" onClick={logout} disabled={busy}><LogOut size={16}/> Cerrar sesión</button></div>
      <p className="muted">Cerrar sesión vuelve al progreso local original de este navegador.</p>
    </> : <>
      <p>Usa el mismo correo en tus dispositivos para continuar con los mismos hábitos y avances. Recibirás un enlace para entrar, sin contraseña.</p>
      <form onSubmit={login}><label htmlFor="account-email">Tu correo electrónico</label><input id="account-email" type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="tu@correo.com"/><button disabled={busy} type="submit"><Mail size={16}/>{busy?'Enviando…':'Recibir enlace de acceso'}</button></form>
      {state.phase==='error' && <button onClick={retryConnection}>Reintentar conexión</button>}
    </>}
    {message && <p role="status">{message}</p>}{error && <p role="alert">{error}</p>}
  </section>;
}
