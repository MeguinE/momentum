import { beforeEach, afterEach, it, expect, vi } from 'vitest';
import { createEmptyData, STORAGE_KEY } from '../storage/storage';
const mock = vi.hoisted(()=>({
  read:vi.fn(), write:vi.fn(), getSession:vi.fn(), signOut:vi.fn(),
  handler:null as null | ((event:string,session:{user:{id:string,email:string}}|null)=>void),
}));
vi.mock('./client',()=>({
  cloudConfigured:true,
  getCloudClient:()=>({
    auth:{
      getSession:mock.getSession,
      onAuthStateChange:(fn:typeof mock.handler)=>{mock.handler=fn;},
      signOut:mock.signOut,
    },
    from:()=>({select:()=>({eq:()=>({maybeSingle:mock.read})})}),
    rpc:mock.write,
  }),
}));
const habit={id:'a',name:'Leer',unit:'count' as const,color:'progress',createdAt:'2026-10-26T00:00:00Z',archived:false};
const original={...createEmptyData(),habits:[{...habit,id:'guest',name:'Local original'}]};
const remoteData={...createEmptyData(),habits:[habit]};
let server:{data:typeof remoteData;revision:number}|null;
let sync:typeof import('./sync');
let store:typeof import('../stores/habitsStore');
beforeEach(async()=>{
  vi.resetModules(); vi.useFakeTimers(); vi.clearAllMocks(); localStorage.clear();
  localStorage.setItem(STORAGE_KEY,JSON.stringify(original));
  server={data:structuredClone(remoteData),revision:1};
  mock.getSession.mockResolvedValue({data:{session:{user:{id:'alice',email:'alice@example.com'}}},error:null});
  mock.signOut.mockResolvedValue({error:null});
  mock.read.mockImplementation(async()=>({data:structuredClone(server),error:null}));
  mock.write.mockImplementation(async(_name,args)=>{
    if(args.expected_revision!==(server?.revision??0))return {data:null,error:null};
    server={data:structuredClone(args.new_data),revision:(server?.revision??0)+1};
    return {data:structuredClone(server),error:null};
  });
  Object.defineProperty(navigator,'locks',{configurable:true,value:{request:vi.fn((_name,_options,callback)=>callback({name:'lock'}))}});
  Object.defineProperty(navigator,'onLine',{configurable:true,value:true});
  sync=await import('./sync'); store=await import('../stores/habitsStore');
});
afterEach(()=>{vi.clearAllTimers();vi.useRealTimers();});
async function boot(){sync.startCloud();await vi.advanceTimersByTimeAsync(1);}
it('loads the account without overwriting the original browser data',async()=>{
  await boot();
  expect(store.$habitData.get()).toEqual(remoteData);
  expect(sync.$cloud.get().phase).toBe('ready');
  expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual(original);
});
it('asks before migrating and imports the original data only once',async()=>{
  server=null; await boot();
  expect(sync.$cloud.get().phase).toBe('migration');
  expect(mock.write).not.toHaveBeenCalled();
  await sync.beginAccount(true);
  expect(server!.data).toEqual(original);
  expect(server!.revision).toBe(1);
});
it('merges independent device changes and retries an atomic revision conflict',async()=>{
  await boot();
  store.logHabit('a','2026-10-26',5);
  mock.write.mockImplementationOnce(async()=>{
    server={data:{...remoteData,logs:[{habitId:'a',date:'2026-10-25',value:8}]},revision:2};
    return {data:null,error:null};
  });
  await sync.synchronize();
  expect(server!.data.logs).toHaveLength(2);
  expect(server!.revision).toBe(3);
  expect(sync.$cloud.get().phase).toBe('ready');
});
it('keeps local edits when the network fails and sends them on retry',async()=>{
  await boot();
  store.logHabit('a','2026-10-26',5);
  mock.read.mockRejectedValueOnce(new Error('offline'));
  await sync.synchronize();
  expect(sync.$cloud.get().phase).toBe('error');
  expect(JSON.parse(localStorage.getItem('momentum:cloud:alice')!).local.logs[0].value).toBe(5);
  await sync.synchronize();
  expect(server!.data.logs[0].value).toBe(5);
});
it('keeps edits made while an upload is in flight',async()=>{
  await boot();
  store.logHabit('a','2026-10-26',5);
  let release!:()=>void;
  mock.write.mockImplementationOnce(async(_name,args)=>{
    await new Promise<void>(resolve=>{release=resolve;});
    server={data:structuredClone(args.new_data),revision:2};
    return {data:structuredClone(server),error:null};
  });
  const pending=sync.synchronize();
  await vi.advanceTimersByTimeAsync(1);
  store.logHabit('a','2026-10-26',10);
  release(); await pending;
  expect(server!.data.logs[0].value).toBe(10);
});
it('blocks conflicting edits until an explicit choice and backs up both versions',async()=>{
  await boot();
  store.logHabit('a','2026-10-26',5);
  server={data:{...remoteData,logs:[{habitId:'a',date:'2026-10-26',value:8}]},revision:2};
  await sync.synchronize();
  expect(sync.$cloud.get().phase).toBe('conflict');
  expect(store.$dataReady.get()).toBe(false);
  sync.resolveConflict('remote');
  await vi.advanceTimersByTimeAsync(1);
  expect(store.$habitData.get().logs[0].value).toBe(8);
  expect(Object.keys(localStorage).some(k=>k.startsWith('momentum:conflict-backup:alice:'))).toBe(true);
});
it('restores the guest workspace after logout instead of exposing account data',async()=>{
  await boot();
  await sync.signOut();
  expect(store.$habitData.get()).toEqual(original);
  expect(sync.$cloud.get().email).toBeUndefined();
});
it('does not allow a second tab to overwrite the active tab outbox',async()=>{
  Object.defineProperty(navigator,'locks',{configurable:true,value:{request:vi.fn((_name,_options,callback)=>callback(null))}});
  await boot();
  expect(sync.$cloud.get().phase).toBe('locked');
  expect(store.$dataReady.get()).toBe(false);
  expect(mock.read).not.toHaveBeenCalled();
});
it('discards a late response after the account is signed out',async()=>{
  let release!:(value:unknown)=>void;
  mock.read.mockImplementationOnce(()=>new Promise(resolve=>{release=resolve;}));
  await boot();
  await sync.signOut();
  release({data:{data:remoteData,revision:1},error:null});
  await vi.advanceTimersByTimeAsync(1);
  expect(store.$habitData.get()).toEqual(original);
  expect(sync.$cloud.get().phase).toBe('local');
});
