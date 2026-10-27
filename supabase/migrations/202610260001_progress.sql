-- Run once in your Supabase SQL editor. No service-role key belongs in the app.
create table public.momentum_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null,
  revision bigint not null default 1 check (revision > 0),
  updated_at timestamptz not null default now(),
  constraint valid_progress check (
    jsonb_typeof(data) = 'object' and data->>'version' = '1'
    and jsonb_typeof(data->'habits') = 'array'
    and jsonb_typeof(data->'logs') = 'array'
  )
);
alter table public.momentum_progress enable row level security;
revoke all on public.momentum_progress from anon, authenticated;
grant select on public.momentum_progress to authenticated;
create policy "Read own progress" on public.momentum_progress
  for select to authenticated using ((select auth.uid()) = user_id);

-- Atomic compare-and-swap. A stale writer receives null and must fetch/merge again.
create function public.save_momentum_progress(expected_revision bigint, new_data jsonb)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  saved public.momentum_progress;
begin
  if uid is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if expected_revision < 0 or expected_revision is null then raise exception 'Invalid revision'; end if;
  if new_data is null or octet_length(new_data::text) > 5000000 then raise exception 'Invalid document size'; end if;
  if expected_revision = 0 then
    insert into public.momentum_progress(user_id, data)
    values(uid, new_data)
    on conflict (user_id) do nothing returning * into saved;
  else
    update public.momentum_progress
      set data = new_data, revision = revision + 1, updated_at = now()
      where user_id = uid and revision = expected_revision returning * into saved;
  end if;
  if saved.user_id is null then return null; end if;
  return jsonb_build_object('data', saved.data, 'revision', saved.revision);
end;
$$;
revoke all on function public.save_momentum_progress(bigint, jsonb) from public, anon;
grant execute on function public.save_momentum_progress(bigint, jsonb) to authenticated;
