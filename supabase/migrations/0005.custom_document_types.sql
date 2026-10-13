-- ============================================================
-- Custom document types, per workspace.
--
-- Built-in types stay in code (lib/intellects/). A workspace can add its
-- own, or copy a built-in and change it. `definition` holds the form the
-- user filled in; the app turns it into a full document type on read.
--
-- Safe to re-run. Paste into Supabase -> SQL Editor -> Run.
-- ============================================================

create table if not exists public.custom_intellects (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  key          text not null,
  definition   jsonb not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  primary key (workspace_id, key)
);

alter table public.custom_intellects enable row level security;

drop policy if exists "workspace access via parent workspace" on public.custom_intellects;
create policy "workspace access via parent workspace" on public.custom_intellects for all
  using (workspace_id in (select id from public.workspaces where owner_id = auth.uid()))
  with check (workspace_id in (select id from public.workspaces where owner_id = auth.uid()));

notify pgrst, 'reload schema';

-- should return 1 row
select table_name from information_schema.tables
where table_schema = 'public' and table_name = 'custom_intellects';
