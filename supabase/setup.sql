-- ============================================================
-- Doc-Vision-1, full database setup for a NEW Supabase project.
--
-- Paste this whole file into Supabase Dashboard -> SQL Editor -> Run.
-- It is 0001.init.sql + 0002.rag.sql combined, and safe to re-run.
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

create table if not exists public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id      uuid not null,
  role         text not null default 'owner' check (role in ('owner','admin','member','viewer')),
  created_at   timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

-- ---------- assets (original uploaded files) ----------

create table if not exists public.assets (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null references public.workspaces(id) on delete cascade,
  filename        text not null,
  description     text,
  mime_type       text not null,
  storage_path    text not null,
  status          text not null default 'pending' check (status in ('pending','processing','ready','error')),
  error_message   text,
  intellect_key   text,                      -- document type, see lib/intellects/
  source          text not null default 'upload',   -- 'upload' | 'google_sheets'
  external_id     text,                      -- Google file id for linked sheets
  external_modified timestamptz,             -- the sheet's last-modified time when we last read it
  last_synced_at  timestamptz,
  sync_error      text,
  created_at      timestamptz not null default now()
);

create index if not exists assets_workspace_idx on public.assets (workspace_id);
create index if not exists assets_external_idx on public.assets (workspace_id, external_id);

-- ---------- workspace_intellects (which document intellects a workspace has equipped) ----------

create table if not exists public.workspace_intellects (
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  intellect_key text not null,
  created_at    timestamptz not null default now(),
  primary key (workspace_id, intellect_key)
);

-- ---------- custom_intellects (document types a workspace defines itself) ----------

create table if not exists public.custom_intellects (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  key          text not null,
  definition   jsonb not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  primary key (workspace_id, key)
);

-- ---------- document_dates (dates and deadlines found in uploaded documents) ----------

create table if not exists public.document_dates (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null references public.workspaces(id) on delete cascade,
  asset_id        uuid not null references public.assets(id) on delete cascade,
  label           text not null,
  date_value      date,
  kind            text not null,
  quote           text,
  page            int,
  deadline_date   date,
  deadline_basis  text,
  deadline_rule   text,
  stated_due      date,
  rule_due        date,
  note            text,
  created_at      timestamptz not null default now()
);
create index if not exists document_dates_workspace_idx on public.document_dates (workspace_id);
create index if not exists document_dates_asset_idx on public.document_dates (asset_id);
create index if not exists document_dates_due_idx on public.document_dates (workspace_id, deadline_date);

-- ---------- extracted_items (legacy V1 fact extraction) ----------

create table if not exists public.extracted_items (
  id                   uuid primary key default gen_random_uuid(),
  workspace_id         uuid not null references public.workspaces(id) on delete cascade,
  asset_id             uuid not null references public.assets(id) on delete cascade,
  kind                 text not null default 'fact',
  data                 jsonb not null default '{}'::jsonb,
  content              text not null,
  embedding            vector(768),
  extraction_provider  text not null,
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

-- ---------- n8n_vectors (RAG chunks + embeddings) ----------
-- Same shape n8n's PGVector Store node uses. 1536 dims fits both
-- OpenAI text-embedding-3-small and gemini-embedding-001 @ 1536.

create table if not exists public.n8n_vectors (
  id         uuid primary key default gen_random_uuid(),
  text       text,
  metadata   jsonb,
  embedding  vector(1536)
);

create index if not exists n8n_vectors_metadata_idx on public.n8n_vectors using gin (metadata jsonb_path_ops);
create index if not exists n8n_vectors_asset_idx on public.n8n_vectors ((metadata->>'asset_id'));

-- ---------- functions & triggers ----------

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

-- Similarity search used by the app (lib/rag/vector-store.js)
create or replace function public.match_n8n_vectors(
  query_embedding vector(1536),
  match_count     int   default 5,
  filter          jsonb default '{}'::jsonb
)
returns table (id uuid, text text, metadata jsonb, similarity float)
language sql stable
as $$
  select v.id, v.text, v.metadata, 1 - (v.embedding <=> query_embedding) as similarity
  from public.n8n_vectors v
  where v.metadata @> filter
  order by v.embedding <=> query_embedding
  limit match_count;
$$;

-- Deleting an asset (or its workspace) deletes its vectors
create or replace function public.delete_asset_vectors()
returns trigger language plpgsql as $$
begin
  delete from public.n8n_vectors where metadata->>'asset_id' = old.id::text;
  return old;
end;
$$;

drop trigger if exists assets_delete_vectors on public.assets;
create trigger assets_delete_vectors
  after delete on public.assets
  for each row execute function public.delete_asset_vectors();

-- ---------- Row Level Security ----------
-- The app's API routes use the service role key, which bypasses RLS.
-- These policies only matter once real auth ships.

alter table public.workspaces        enable row level security;
alter table public.workspace_members enable row level security;
alter table public.assets            enable row level security;
alter table public.extracted_items   enable row level security;
alter table public.conversations     enable row level security;
alter table public.messages          enable row level security;
alter table public.n8n_vectors       enable row level security;
alter table public.workspace_intellects enable row level security;
alter table public.document_dates enable row level security;
alter table public.custom_intellects enable row level security;

drop policy if exists "owner can do everything on their workspaces" on public.workspaces;
create policy "owner can do everything on their workspaces"
  on public.workspaces for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists "members can read their workspaces" on public.workspace_members;
create policy "members can read their workspaces"
  on public.workspace_members for select
  using (user_id = auth.uid());

drop policy if exists "workspace access via parent workspace" on public.assets;
create policy "workspace access via parent workspace" on public.assets for all
  using (workspace_id in (select id from public.workspaces where owner_id = auth.uid()))
  with check (workspace_id in (select id from public.workspaces where owner_id = auth.uid()));

drop policy if exists "workspace access via parent workspace" on public.extracted_items;
create policy "workspace access via parent workspace" on public.extracted_items for all
  using (workspace_id in (select id from public.workspaces where owner_id = auth.uid()))
  with check (workspace_id in (select id from public.workspaces where owner_id = auth.uid()));

drop policy if exists "workspace access via parent workspace" on public.workspace_intellects;
create policy "workspace access via parent workspace" on public.workspace_intellects for all
  using (workspace_id in (select id from public.workspaces where owner_id = auth.uid()))
  with check (workspace_id in (select id from public.workspaces where owner_id = auth.uid()));

drop policy if exists "workspace access via parent workspace" on public.document_dates;
create policy "workspace access via parent workspace" on public.document_dates for all
  using (workspace_id in (select id from public.workspaces where owner_id = auth.uid()))
  with check (workspace_id in (select id from public.workspaces where owner_id = auth.uid()));

drop policy if exists "workspace access via parent workspace" on public.custom_intellects;
create policy "workspace access via parent workspace" on public.custom_intellects for all
  using (workspace_id in (select id from public.workspaces where owner_id = auth.uid()))
  with check (workspace_id in (select id from public.workspaces where owner_id = auth.uid()));

drop policy if exists "workspace access via parent workspace" on public.conversations;
create policy "workspace access via parent workspace" on public.conversations for all
  using (workspace_id in (select id from public.workspaces where owner_id = auth.uid()))
  with check (workspace_id in (select id from public.workspaces where owner_id = auth.uid()));

drop policy if exists "workspace access via parent conversation" on public.messages;
create policy "workspace access via parent conversation" on public.messages for all
  using (conversation_id in (
    select c.id from public.conversations c
    join public.workspaces w on w.id = c.workspace_id
    where w.owner_id = auth.uid()
  ));

-- ---------- Storage bucket for original files (private) ----------

insert into storage.buckets (id, name, public)
values ('assets', 'assets', false)
on conflict (id) do nothing;

-- ---------- sanity check: should list 10 tables ----------

select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('workspaces','workspace_members','assets','extracted_items','conversations','messages','n8n_vectors','workspace_intellects','document_dates','custom_intellects')
order by table_name;

-- make the API see the new column/table immediately
notify pgrst, 'reload schema';
