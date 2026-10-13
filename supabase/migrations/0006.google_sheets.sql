-- ============================================================
-- Files linked from Google Sheets.
--
-- A linked file is a normal row in `assets` that also remembers where it
-- came from, so it can be re-read when the sheet changes.
--
-- Safe to re-run. Paste into Supabase -> SQL Editor -> Run.
-- ============================================================

alter table public.assets add column if not exists source text not null default 'upload';
alter table public.assets add column if not exists external_id text;
alter table public.assets add column if not exists external_modified timestamptz;
alter table public.assets add column if not exists last_synced_at timestamptz;
alter table public.assets add column if not exists sync_error text;

create index if not exists assets_external_idx on public.assets (workspace_id, external_id);

notify pgrst, 'reload schema';

-- should return 5 rows
select column_name from information_schema.columns
where table_schema = 'public' and table_name = 'assets'
  and column_name in ('source','external_id','external_modified','last_synced_at','sync_error');
