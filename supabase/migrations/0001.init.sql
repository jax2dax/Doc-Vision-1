-- ============================================================
-- Arcspace V1 schema
--
-- Design notes (matches the architecture we agreed on):
--   * every table carries workspace_id -> this is the isolation
--     boundary. No query anywhere should skip it.
--   * assets = original files, untouched, forever.
--   * extracted_items = the "workspace data layer": structured
--     data (jsonb) + flattened text (content) + embedding, all
--     tagged with which asset they came from (provenance) and
--     which extraction provider produced them.
--   * deleting an asset cascades to its extracted_items via FK
--     ON DELETE CASCADE -> "delete = forget" is enforced by the
--     database, not application code that can be forgotten.
-- ============================================================

create extension if not exists "pgcrypto";
create extension if not exists "vector";

-- ---------- workspaces ----------

create table if not exists public.workspaces (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null,               -- references auth.users(id) once auth ships
  name         text not null,
  description  text,
  color        text not null default '#7c3aed',
  status       text not null default 'active' check (status in ('active','idle','error')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ---------- workspace_members ----------
-- Not used yet (V1 is single-user), but the table exists now so
-- V1.6 (collaboration) is "add rows" not "add a table + migrate".

create table if not exists public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id      uuid not null,
  role         text not null default 'owner' check (role in ('owner','admin','member','viewer')),
  created_at   timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

-- ---------- assets ----------
-- The original uploaded file. Never overwritten by extraction.

create table if not exists public.assets (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null references public.workspaces(id) on delete cascade,
  filename        text not null,
  description     text,                      -- user-supplied hint, e.g. "staff schedule, not clients"
  mime_type       text not null,
  storage_path    text not null,             -- path inside the Supabase Storage bucket
  status          text not null default 'pending' check (status in ('pending','processing','ready','error')),
  error_message   text,
  created_at      timestamptz not null default now()
);

-- ---------- extracted_items ----------
-- The workspace data layer. One row per "fact" or "chunk" pulled
-- out of an asset. `data` holds structured fields, `content` holds
-- a flattened text version (used for context + future embedding search).

create table if not exists public.extracted_items (
  id                   uuid primary key default gen_random_uuid(),
  workspace_id         uuid not null references public.workspaces(id) on delete cascade,
  asset_id             uuid not null references public.assets(id) on delete cascade,
  kind                 text not null default 'fact',   -- 'fact' | 'document_chunk' | 'table_row' (future)
  data                 jsonb not null default '{}'::jsonb,
  content              text not null,
  embedding            vector(768),                     -- gemini text-embedding-004 dimension
  extraction_provider  text not null,                    -- 'gemini' | 'openai' | ...
  created_at           timestamptz not null default now()
);

create index if not exists extracted_items_workspace_idx on public.extracted_items (workspace_id);
create index if not exists extracted_items_asset_idx on public.extracted_items (asset_id);

-- ---------- conversations / messages ----------

create table if not exists public.conversations (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  title         text,
  created_at    timestamptz not null default now()
);

create table if not exists public.messages (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references public.conversations(id) on delete cascade,
  role             text not null check (role in ('user','assistant')),
  content          text not null,
  created_at       timestamptz not null default now()
);

-- ---------- updated_at trigger for workspaces ----------

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists workspaces_set_updated_at on public.workspaces;
create trigger workspaces_set_updated_at
  before update on public.workspaces
  for each row execute function public.set_updated_at();

-- ============================================================
-- Row Level Security
--
-- Policies are written now (cheap, foundational) even though V1's
-- API routes currently use the Supabase service role key and
-- bypass RLS. Once real auth ships, flip API routes to the
-- user-scoped client and these policies start being the actual
-- enforcement layer with zero schema changes.
-- ============================================================

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.assets enable row level security;
alter table public.extracted_items enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

create policy "owner can do everything on their workspaces"
  on public.workspaces for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "members can read their workspaces"
  on public.workspace_members for select
  using (user_id = auth.uid());

create policy "workspace access via parent workspace" on public.assets for all
  using (workspace_id in (select id from public.workspaces where owner_id = auth.uid()))
  with check (workspace_id in (select id from public.workspaces where owner_id = auth.uid()));

create policy "workspace access via parent workspace" on public.extracted_items for all
  using (workspace_id in (select id from public.workspaces where owner_id = auth.uid()))
  with check (workspace_id in (select id from public.workspaces where owner_id = auth.uid()));

create policy "workspace access via parent workspace" on public.conversations for all
  using (workspace_id in (select id from public.workspaces where owner_id = auth.uid()))
  with check (workspace_id in (select id from public.workspaces where owner_id = auth.uid()));

create policy "workspace access via parent conversation" on public.messages for all
  using (conversation_id in (
    select c.id from public.conversations c
    join public.workspaces w on w.id = c.workspace_id
    where w.owner_id = auth.uid()
  ));