import { atom } from 'nanostores';
import { getCloudClient, cloudConfigured } from './client';
import { readCache, writeCache, validSnapshot, type Cache, type Snapshot } from './cache';
import { mergeProgress, same } from './merge';
import { $habitData, $dataReady, $saveError, setDataWriter } from '../stores/habitsStore';
import { createEmptyData, loadData, saveData, type HabitTrackerData } from '../storage/storage';

type Phase = 'local' | 'loading' | 'ready' | 'pending' | 'syncing' | 'offline' | 'error' | 'migration' | 'conflict' | 'locked';
export const $cloud = atom<{ phase:Phase; email?:string; message?:string; lastSync?:string }>({phase: cloudConfigured ? 'loading' : 'local'});
if (cloudConfigured) $dataReady.set(false);
let userId: string | null = null;
let cache: Cache | null = null;
let generation = 0;
let started = false;
let syncing = false;
let timer: ReturnType<typeof setTimeout> | undefined;
let releaseLock: (() => void) | undefined;
let conflictRemote: Snapshot | null = null;
let guest = loadData();

function state(phase: Phase, message?: string) {
  $cloud.set({...$cloud.get(),phase,message});
}
function checkpoint() {
  if (!userId || !cache) return;
  writeCache(userId,cache);
  $saveError.set(null);
}
function show(data: HabitTrackerData) { $habitData.set(data); }
function schedule() {
  clearTimeout(timer);
  timer = setTimeout(() => void synchronize(), 600);
}
function installWriter() {
  setDataWriter(data => {
    if (!cache || !userId) return {ok:false,error:'No hay una sesión lista.'};
    cache = {...cache,local:data};
    try { checkpoint(); state('pending'); schedule(); return {ok:true}; }
    catch { state('error','No se pudo guardar la copia local. Exporta un respaldo antes de cerrar.'); return {ok:false,error:'LocalCacheError'}; }
  });
}
export function startCloud() {
  if (started) return;
  started = true;
  if (!cloudConfigured) { $dataReady.set(true); return; }
  try {
    const client = getCloudClient()!;
    // Never await another auth operation inside the auth callback.
    client.auth.onAuthStateChange((_event, session) => {
      setTimeout(() => void switchAccount(session?.user.id ?? null, session?.user.email), 0);
    });
    void client.auth.getSession().then(({data,error}) => {
      if (error) { state('error','No se pudo recuperar la sesión. Reintenta la conexión.'); return; }
      void switchAccount(data.session?.user.id ?? null,data.session?.user.email);
    }).catch(() => state('error','No se pudo recuperar la sesión.'));
    window.addEventListener('online', () => void synchronize());
    window.addEventListener('focus', () => void synchronize());
    document.addEventListener('visibilitychange', () => { if (!document.hidden) void synchronize(); });
    setInterval(() => { if (!document.hidden) void synchronize(); }, 15000);
    window.addEventListener('beforeunload', e => {
      if ($saveError.get()) { e.preventDefault(); }
    });
  } catch { state('error','Revisa la configuración pública de Supabase.'); }
}
let accountInitialized = false;
async function switchAccount(id: string | null, email?: string) {
  if (accountInitialized && id === userId) return;
  accountInitialized = true;
  const epoch = ++generation;
  clearTimeout(timer);
  releaseLock?.(); releaseLock = undefined;
  $dataReady.set(false);
  userId = id; cache = null; conflictRemote = null; syncing = false;
  $cloud.set({phase:'loading',email});
  $saveError.set(null);
  if (!id) {
    setDataWriter(saveData);
    guest = loadData(); show(guest);
    state('local'); $dataReady.set(true); return;
  }
  show(createEmptyData());
  // Only one tab edits this browser's durable outbox at a time.
  if (!navigator.locks) { state('error','Usa un navegador actualizado para sincronizar de forma segura.'); return; }
  void navigator.locks.request('momentum-account:' + id, {ifAvailable:true}, async lock => {
    if (epoch !== generation) return;
    if (!lock) { state('locked','Momentum está abierto en otra pestaña. Ciérrala y recarga esta página.'); return; }
    const held = new Promise<void>(resolve => { releaseLock = resolve; });
    try {
      cache = readCache(id);
      if (cache) { show(cache.local); installWriter(); $dataReady.set(true); }
      await synchronize();
    } catch { state('error','No se pudo leer la copia local. Conserva los datos del navegador y exporta un respaldo.'); }
    await held;
  });
}
async function fetchRemote(id: string): Promise<Snapshot> {
  const {data,error} = await getCloudClient()!.from('momentum_progress').select('data,revision').eq('user_id',id).maybeSingle();
  if (error) throw error;
  if (!data) return {data:createEmptyData(),revision:0};
  if (!validSnapshot(data)) throw new Error('Formato remoto incompatible');
  return data;
}
export async function synchronize() {
  if (!userId || syncing || !releaseLock || ['migration','conflict','locked'].includes($cloud.get().phase)) return;
  const id = userId, epoch = generation;
  syncing = true;
  state('syncing');
  try {
    for (let attempt = 0; attempt < 4; attempt++) {
      const remote = await fetchRemote(id);
      if (epoch !== generation) return;
      if (!cache) {
        if (remote.revision === 0) { state('migration'); return; }
        cache = {base:remote,local:remote.data};
        checkpoint(); show(cache.local); installWriter(); $dataReady.set(true);
      }
      const merged = mergeProgress(cache.base.data,cache.local,remote.data);
      if (merged.conflicts.length) {
        conflictRemote = remote;
        $dataReady.set(false);
        state('conflict','Hay cambios diferentes en el mismo hábito, registro o ruta.');
        return;
      }
      cache = {base:remote,local:merged.data};
      checkpoint(); show(cache.local);
      if (same(cache.local,remote.data) && remote.revision > 0) {
        $cloud.set({...$cloud.get(),phase:'ready',message:undefined,lastSync:new Date().toISOString()});
        return;
      }
      const sent = cache.local;
      const {data,error} = await getCloudClient()!.rpc('save_momentum_progress',{expected_revision:remote.revision,new_data:sent});
      if (epoch !== generation) return;
      if (error) throw error;
      if (data === null) continue; // CAS lost to another device; fetch and merge.
      if (!validSnapshot(data)) throw new Error('Respuesta inválida');
      cache = {base:data,local:cache!.local}; // Preserve edits made while request was in flight.
      checkpoint();
      if (same(cache.local,sent)) {
        $cloud.set({...$cloud.get(),phase:'ready',message:undefined,lastSync:new Date().toISOString()}); return;
      }
    }
    state('pending'); schedule();
  } catch {
    if (epoch === generation) state(navigator.onLine ? 'error' : 'offline', cache
      ? 'Tus cambios siguen en este dispositivo. Se reintentará la sincronización.'
      : 'No se pudo cargar tu progreso. Revisa la conexión y la configuración de Supabase.');
  } finally { if (epoch === generation) syncing = false; }
}
export async function beginAccount(importLocal: boolean) {
  if (!userId || $cloud.get().phase !== 'migration') return;
  cache = {base:{data:createEmptyData(),revision:0},local:importLocal ? loadData() : createEmptyData()};
  try {
    checkpoint(); installWriter(); show(cache.local); state('pending'); $dataReady.set(true);
    await synchronize();
  } catch { state('migration','No se pudo guardar la copia local. Libera espacio y vuelve a intentar.'); }
}
export function resolveConflict(prefer: 'local'|'remote') {
  if (!cache || !conflictRemote || !userId) return;
  try {
    // Preserve both alternatives before applying an explicit choice.
    localStorage.setItem('momentum:conflict-backup:' + userId + ':' + Date.now(),JSON.stringify({local:cache.local,remote:conflictRemote.data}));
    const merged = mergeProgress(cache.base.data,cache.local,conflictRemote.data,prefer);
    cache = {base:conflictRemote,local:merged.data}; checkpoint();
    conflictRemote = null; show(cache.local); state('pending'); $dataReady.set(true); void synchronize();
  } catch { state('conflict','No hay espacio para conservar las dos versiones. Descarga un respaldo antes de continuar.'); }
}
export function downloadConflict() {
  if (!cache || !conflictRemote) return;
  const url = URL.createObjectURL(new Blob([JSON.stringify({local:cache.local,remote:conflictRemote.data},null,2)],{type:'application/json'}));
  const link = document.createElement('a'); link.href=url; link.download='momentum-versiones-en-conflicto.json'; link.click(); URL.revokeObjectURL(url);
}
export async function signOut() {
  if (cache && !same(cache.local,cache.base.data)) {
    await synchronize();
    if (cache && !same(cache.local,cache.base.data)) throw new Error('Hay cambios pendientes. Sincroniza o resuelve el conflicto antes de cerrar sesión.');
  }
  const {error} = await getCloudClient()!.auth.signOut({scope:'local'});
  if (error) throw error;
  await switchAccount(null);
}
export function retryConnection() {
  if (!accountInitialized || !releaseLock) { location.reload(); return; }
  void synchronize();
}
