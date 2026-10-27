import { useState, type SubmitEvent } from 'react';
import { useStore } from '@nanostores/react';
import { Cloud, RefreshCw, LogOut, LogIn, Mail } from 'lucide-react';
import { cloudConfigured, getCloudClient } from '../../lib/cloud/client';
import { $cloud, synchronize, signOut, retryConnection } from '../../lib/cloud/sync';

type AuthMethod = 'email' | 'google';
type BusyAction = AuthMethod | 'logout' | null;

function authErrorMessage(error: unknown, method: AuthMethod) {
  const detail = error instanceof Error ? error.message : '';
  if (/rate limit|too many requests/i.test(detail)) return 'Se alcanzó el límite de correos de acceso. Espera una hora o continúa con Google.';
  if (method === 'google' && /provider|oauth/i.test(detail)) return 'Google todavía no está habilitado correctamente en Supabase.';
  const fallback = method === 'google' ? 'No se pudo iniciar sesión con Google.' : 'No se pudo enviar el enlace de acceso.';
  return detail ? `${fallback} ${detail}` : fallback;
}

export default function AccountPanel() {
  const state = useStore($cloud);
  const [email,setEmail] = useState('');
  const [busy,setBusy] = useState<BusyAction>(null);
  const [message,setMessage] = useState('');
  const [error,setError] = useState('');

  async function loginWithGoogle() {
    setBusy('google'); setError(''); setMessage('');
    try {
      const {error} = await getCloudClient()!.auth.signInWithOAuth({provider:'google',options:{redirectTo:location.origin+'/profile'}});
      if (error) throw error;
    } catch (error) { setError(authErrorMessage(error,'google')); }
    finally { setBusy(null); }
  }

  async function loginWithEmail(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy('email'); setError(''); setMessage('');
    try {
      const {error} = await getCloudClient()!.auth.signInWithOtp({email:email.trim(),options:{emailRedirectTo:location.origin+'/profile'}});
      if (error) throw error;
      setMessage('Revisa tu correo y abre el enlace en este dispositivo. Usa el mismo correo en tu celular y tu laptop.');
    } catch (error) { setError(authErrorMessage(error,'email')); }
    finally { setBusy(null); }
  }

  async function logout() {
    setBusy('logout'); setError('');
    try { await signOut(); }
    catch (error) { setError(error instanceof Error ? error.message : 'No se pudo cerrar sesión.'); }
    finally {setBusy(null);}
  }

  return <section id="account" className="account-panel glass">
    <h2><Cloud size={22}/> Cuenta y sincronización</h2>
    {!cloudConfigured ? <p>La conexión a Supabase aún no está configurada. Tus hábitos siguen guardándose en este navegador.</p>
    : state.email ? <>
      <p>Sesión iniciada como <strong>{state.email}</strong></p>
      <p role="status">{state.phase==='ready'?'Tu progreso está sincronizado.':state.message ?? (state.phase==='pending'?'Tienes cambios pendientes de enviar.':'Guardando y comprobando cambios…')}</p>
      {state.lastSync && <p className="muted">Última sincronización: {new Date(state.lastSync).toLocaleTimeString('es-MX')}</p>}
      <p>Al cargar se recuperan los avances de la nube y se envían los cambios pendientes de este dispositivo. Si pierdes conexión, los cambios quedan pendientes en este navegador y se envían al volver.</p>
      <div className="account-actions"><button onClick={()=>void synchronize()} disabled={busy !== null || state.phase==='syncing'}><RefreshCw size={16}/> Cargar y sincronizar</button><button className="secondary" onClick={logout} disabled={busy !== null}><LogOut size={16}/> Cerrar sesión</button></div>
      <p className="muted">Cerrar sesión vuelve al progreso local original de este navegador.</p>
    </> : <>
      <p>Usa la misma cuenta en tus dispositivos para continuar con los mismos hábitos y avances.</p>
      <div className="account-actions"><button type="button" onClick={()=>void loginWithGoogle()} disabled={busy !== null}><LogIn size={16}/>{busy==='google'?'Abriendo Google…':'Continuar con Google'}</button></div>
      <p className="muted">O recibe un enlace de acceso por correo.</p>
      <form onSubmit={loginWithEmail}><label htmlFor="account-email">Tu correo electrónico</label><input id="account-email" type="email" autoComplete="email" required value={email} onChange={event=>setEmail(event.target.value)} placeholder="tu@correo.com"/><button disabled={busy !== null} type="submit"><Mail size={16}/>{busy==='email'?'Enviando…':'Recibir enlace de acceso'}</button></form>
      {state.phase==='error' && <button onClick={retryConnection}>Reintentar conexión</button>}
    </>}
    {message && <p role="status">{message}</p>}{error && <p role="alert">{error}</p>}
  </section>;
}
