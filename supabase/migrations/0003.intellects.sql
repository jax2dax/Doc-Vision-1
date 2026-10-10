-- ============================================================
-- Intellects
--
--   * The intellects themselves live in code (lib/intellects/), so
--     you can edit the defaults at any time with no migration.
--   * workspace_intellects = which intellects a workspace has equipped.
--   * assets.intellect_key = which document type a file is (isp, ...).
--
-- Safe to re-run. Paste into Supabase -> SQL Editor -> Run.
-- ============================================================

alter table public.assets add column if not exists intellect_key text;

create table if not exists public.workspace_intellects (
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  intellect_key text not null,
  created_at    timestamptz not null default now(),
  primary key (workspace_id, intellect_key)
);

alter table public.workspace_intellects enable row level security;

drop policy if exists "workspace access via parent workspace" on public.workspace_intellects;
create policy "workspace access via parent workspace" on public.workspace_intellects for all
  using (workspace_id in (select id from public.workspaces where owner_id = auth.uid()))
  with check (workspace_id in (select id from public.workspaces where owner_id = auth.uid()));

-- should return 1 row: intellect_key | text
select column_name, data_type from information_schema.columns
where table_schema = 'public' and table_name = 'assets' and column_name = 'intellect_key';

-- make the API see the new column/table immediately
notify pgrst, 'reload schema';
