-- ============================================================
-- RAG: in-app replacement for the n8n upload + retrieval workflows
--
--   * n8n_vectors keeps the exact shape n8n's "Postgres PGVector
--     Store" node creates (id / text / metadata / embedding(1536)),
--     so anything n8n already ingested stays searchable.
--   * Every chunk's metadata carries workspace_id + asset_id. Search
--     always filters on workspace_id, same isolation rule as 0001.
--   * Deleting an asset deletes its vectors (trigger below), so
--     "delete = forget" holds here too, even without an FK.
-- ============================================================

create extension if not exists "vector";

create table if not exists public.n8n_vectors (
  id         uuid primary key default gen_random_uuid(),
  text       text,
  metadata   jsonb,
  embedding  vector(1536)
);

-- Metadata filter (workspace_id / asset_id) is the hot path. No ANN
-- index on `embedding` on purpose: an HNSW index post-filters, so a
-- small workspace inside a big table can come back with too few rows.
-- Exact scan per workspace is fine at V1 scale.
create index if not exists n8n_vectors_metadata_idx on public.n8n_vectors using gin (metadata jsonb_path_ops);
create index if not exists n8n_vectors_asset_idx on public.n8n_vectors ((metadata->>'asset_id'));

alter table public.n8n_vectors enable row level security;

-- ---------- similarity search (the PGVector Store "retrieve" mode) ----------

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

-- ---------- delete asset => delete its vectors ----------

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

-- ---------- storage bucket for original files ----------

insert into storage.buckets (id, name, public)
values ('assets', 'assets', false)
on conflict (id) do nothing;
