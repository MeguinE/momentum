import { useEffect, useRef } from 'react';
import { useStore } from '@nanostores/react';
import { Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { $dataReady } from '../../lib/stores/habitsStore';
import { $cloud, startCloud, retryConnection, beginAccount, resolveConflict, downloadConflict, signOut } from '../../lib/cloud/sync';
const labels:Record<string,string> = {local:'Solo en este navegador',loading:'Conectando…',ready:'Sincronizado',pending:'Cambios pendientes',syncing:'Sincronizando…',offline:'Sin conexión · pendiente',error:'Revisar sincronización',migration:'Vincular progreso',conflict:'Resolver cambios',locked:'Otra pestaña abierta'};
export default function CloudStatus() {
  const state = useStore($cloud), ready = useStore($dataReady);
  const dialog = useRef<HTMLElement>(null);
  useEffect(startCloud,[]);
  useEffect(() => {
    const background = document.querySelectorAll<HTMLElement>('main, .sidebar');
    background.forEach(element => { element.inert = !ready; });
    if (!ready) dialog.current?.focus();
    return () => background.forEach(element => { element.inert = false; });
  },[ready,state.phase]);
  return <>
    <a className="cloud-badge" href="/settings#account" title={state.message ?? labels[state.phase]}>{state.phase==='offline'?<CloudOff size={15}/>:<Cloud size={15}/>}<span>{labels[state.phase]}</span></a>
    {!ready && <div className="cloud-overlay"><section ref={dialog} tabIndex={-1} onKeyDown={event=>{ if(event.key!=='Tab')return; const buttons=dialog.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'); if(!buttons?.length)return; const first=buttons[0],last=buttons[buttons.length-1]; if(event.shiftKey && (document.activeElement===first || document.activeElement===dialog.current)){event.preventDefault();last.focus();}else if(!event.shiftKey && document.activeElement===last){event.preventDefault();first.focus();} }} role="dialog" aria-modal="true" aria-labelledby="cloud-title" className="cloud-dialog glass">
      <h2 id="cloud-title">{state.phase==='migration'?'Tu progreso, en todos tus dispositivos':state.phase==='conflict'?'Revisemos estos cambios':labels[state.phase]}</h2>
      {state.phase==='migration' ? <>
        <p>Esta cuenta aún no tiene progreso en la nube. Puedes llevar tus hábitos, registros y rutas de este navegador, o empezar con los hábitos base. La copia original del navegador se conserva.</p>
        <button onClick={()=>void beginAccount(true)}>Vincular mi progreso actual</button>
        <button className="secondary" onClick={()=>void beginAccount(false)}>Empezar con los hábitos base</button>
      </> : state.phase==='conflict' ? <>
        <p>{state.message} Los cambios compatibles se combinan. Elige qué versión conservar en los registros que chocan; se guarda una copia de ambas.</p>
        <button className="secondary" onClick={downloadConflict}>Descargar ambas versiones</button>
        <button onClick={()=>resolveConflict('local')}>Conservar mis cambios de este dispositivo</button>
        <button onClick={()=>resolveConflict('remote')}>Conservar los cambios de la nube</button>
      </> : <><p>{state.message ?? 'Estamos recuperando tu progreso antes de que sigas registrando.'}</p><button onClick={retryConnection}><RefreshCw size={16}/> Reintentar</button></>}
      {state.phase==='migration' && state.message && <p role="alert">{state.message}</p>}
      {['migration','error','locked'].includes(state.phase) && !ready && <button className="secondary" onClick={()=>void signOut().catch(()=>{})}>Volver al modo local</button>}
    </section></div>}
  </>;
}
