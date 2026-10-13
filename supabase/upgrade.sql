-- ============================================================
-- Upgrade for an existing database: dates, custom types, Google Sheets.
-- Contains 0004 + 0005 + 0006. Safe to run more than once.
-- Paste into Supabase -> SQL Editor -> Run.
-- ============================================================

-- ---------- migrations/0004.document_dates.sql ----------
-- Dates and deadlines found in uploaded documents.
--
-- One row per date the AI found in a file. Rows that are deadlines also
-- carry deadline_date. The deadline rules themselves (e.g. "ISP: review
-- every 12 months") live in code, in lib/intellects/.
--
-- Safe to re-run. Paste into Supabase -> SQL Editor -> Run.

create table if not exists public.document_dates (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null references public.workspaces(id) on delete cascade,
  asset_id        uuid not null references public.assets(id) on delete cascade,
  label           text not null,
  date_value      date,            -- the date as written in the document
  kind            text not null,   -- effective | signed | last_review | review_due | expiry | completion | event | other | derived | missing
  quote           text,
  page            int,
  deadline_date   date,            -- when action is due (null = not a deadline)
  deadline_basis  text,            -- 'stated' (document says so) | 'rule' (intellect requires it)
  deadline_rule   text,            -- intellect deadline rule key
  stated_due      date,            -- due date the document states, if any
  rule_due        date,            -- due date the intellect rule computes, if any
  note            text,
  created_at      timestamptz not null default now()
);

create index if not exists document_dates_workspace_idx on public.document_dates (workspace_id);
create index if not exists document_dates_asset_idx on public.document_dates (asset_id);
create index if not exists document_dates_due_idx on public.document_dates (workspace_id, deadline_date);

alter table public.document_dates enable row level security;

drop policy if exists "workspace access via parent workspace" on public.document_dates;
create policy "workspace access via parent workspace" on public.document_dates for all
  using (workspace_id in (select id from public.workspaces where owner_id = auth.uid()))
  with check (workspace_id in (select id from public.workspaces where owner_id = auth.uid()));

notify pgrst, 'reload schema';


-- ---------- migrations/0005.custom_document_types.sql ----------
-- Custom document types, per workspace.
--
-- Built-in types stay in code (lib/intellects/). A workspace can add its
-- own, or copy a built-in and change it. `definition` holds the form the
-- user filled in; the app turns it into a full document type on read.
--
-- Safe to re-run. Paste into Supabase -> SQL Editor -> Run.

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


-- ---------- migrations/0006.google_sheets.sql ----------
-- Files linked from Google Sheets.
--
-- A linked file is a normal row in `assets` that also remembers where it
-- came from, so it can be re-read when the sheet changes.
--
-- Safe to re-run. Paste into Supabase -> SQL Editor -> Run.

alter table public.assets add column if not exists source text not null default 'upload';
alter table public.assets add column if not exists external_id text;
alter table public.assets add column if not exists external_modified timestamptz;
alter table public.assets add column if not exists last_synced_at timestamptz;
alter table public.assets add column if not exists sync_error text;

create index if not exists assets_external_idx on public.assets (workspace_id, external_id);

notify pgrst, 'reload schema';


