// @vitest-environment node
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { beforeAll, afterAll, describe, it, expect } from 'vitest';
const alice='11111111-1111-4111-8111-111111111111', bob='22222222-2222-4222-8222-222222222222';
let db:PGlite;
const data={version:1,habits:[],logs:[]};
beforeAll(async()=>{
  db=new PGlite();
  await db.exec(`
    create role anon; create role authenticated;
    create schema auth; create table auth.users(id uuid primary key);
    insert into auth.users values ('${alice}'), ('${bob}');
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth to authenticated, anon;
    grant execute on function auth.uid() to authenticated, anon;
  `);
  await db.exec(readFileSync(new URL('../../../supabase/migrations/202610260001_progress.sql',import.meta.url),'utf8'));
},30000);
afterAll(async()=>{await db?.close();});
async function asUser(id:string,role='authenticated'){
  await db.exec('reset role');
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);
  await db.exec('set role '+role);
}
async function save(revision:number,doc=data) {
  const result=await db.query<{result:unknown}>('select public.save_momentum_progress($1,$2::jsonb) as result',[revision,JSON.stringify(doc)]);
  return result.rows[0].result;
}
describe('Supabase SQL permissions and atomic revisions',()=>{
  it('allows authenticated creation and rejects a stale update',async()=>{
    await asUser(alice);
    expect(await save(0)).toMatchObject({revision:1,data});
    expect(await save(0)).toBeNull();
    expect(await save(1)).toMatchObject({revision:2});
    expect(await save(1)).toBeNull();
  });
  it('hides another user’s row and creates independent progress',async()=>{
    await asUser(bob);
    expect((await db.query('select * from public.momentum_progress')).rows).toEqual([]);
    expect(await save(0)).toMatchObject({revision:1});
    expect((await db.query('select user_id from public.momentum_progress')).rows).toEqual([{user_id:bob}]);
  });
  it('rejects direct writes that would bypass revision checks',async()=>{
    await asUser(alice);
    await expect(db.query('update public.momentum_progress set revision=100')).rejects.toThrow(/permission denied/);
  });
  it('rejects anonymous reads and writes',async()=>{
    await asUser('','anon');
    await expect(db.query('select * from public.momentum_progress')).rejects.toThrow(/permission denied/);
    await expect(save(0)).rejects.toThrow(/permission denied/);
  });
  it('rejects RPC calls without an authenticated identity',async()=>{
    await asUser('');
    await expect(save(0)).rejects.toThrow(/Authentication required/);
  });
});
