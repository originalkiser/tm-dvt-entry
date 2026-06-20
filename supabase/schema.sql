-- DVT-Entry Schema (v2)
-- Runs on the same Supabase project as tm-opsperformance.
-- All tables prefixed "dvt_" to avoid conflicts.
-- Run in Supabase SQL Editor.

-- Location lookup
create table if not exists dvt_locations (
  id uuid primary key default gen_random_uuid(),
  location_id text unique not null,
  name text not null,
  sheet_name text not null,
  is_active boolean not null default true,
  created_at timestamptz default now()
);

-- If upgrading from v1, add is_active column:
-- alter table dvt_locations add column if not exists is_active boolean not null default true;

-- Daily entry rows
create table if not exists dvt_daily_entries (
  id uuid primary key default gen_random_uuid(),
  location_id text not null references dvt_locations(location_id),
  entry_date date not null,
  data jsonb not null default '{}',
  confidence jsonb not null default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(location_id, entry_date)
);

-- Named column-order templates (Save View As)
create table if not exists dvt_column_views (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  section text not null default 'eod',   -- 'md' | 'eod'
  column_keys text[] not null,            -- ordered array of column keys
  is_global boolean not null default false,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

-- Column order/visibility config per location (localStorage fallback lives here too)
create table if not exists dvt_column_configs (
  id uuid primary key default gen_random_uuid(),
  location_id text not null,
  column_key text not null,
  display_name text not null,
  column_type text not null default 'number',
  column_order int not null default 0,
  is_visible boolean not null default true,
  unique(location_id, column_key)
);

-- Index for fast date-range queries
create index if not exists dvt_entries_location_date
  on dvt_daily_entries(location_id, entry_date desc);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists dvt_entries_updated_at on dvt_daily_entries;
create trigger dvt_entries_updated_at
  before update on dvt_daily_entries
  for each row execute function update_updated_at();

-- Row Level Security
alter table dvt_locations     enable row level security;
alter table dvt_daily_entries enable row level security;
alter table dvt_column_configs enable row level security;
alter table dvt_column_views   enable row level security;

-- Anon: read locations + entries (data entry doesn't require login in the UI flow
-- but Supabase Auth tokens are sent once logged in — authenticated role used for writes)
drop policy if exists "dvt_anon_locations_read"  on dvt_locations;
drop policy if exists "dvt_auth_entries_all"      on dvt_daily_entries;
drop policy if exists "dvt_auth_configs_all"      on dvt_column_configs;
drop policy if exists "dvt_auth_views_select"     on dvt_column_views;
drop policy if exists "dvt_auth_views_insert"     on dvt_column_views;
drop policy if exists "dvt_auth_views_update"     on dvt_column_views;
drop policy if exists "dvt_auth_views_delete"     on dvt_column_views;
drop policy if exists "dvt_admin_locations_write" on dvt_locations;

-- Locations: authenticated can read; admin can write
create policy "dvt_auth_locations_read"  on dvt_locations for select to authenticated using (true);
create policy "dvt_admin_locations_write" on dvt_locations
  for all to authenticated
  using    (exists (select 1 from user_profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from user_profiles where id = auth.uid() and role = 'admin'));

-- Entries: all authenticated users can read/write
create policy "dvt_auth_entries_all" on dvt_daily_entries
  for all to authenticated using (true) with check (true);

-- Column configs: all authenticated users can read/write
create policy "dvt_auth_configs_all" on dvt_column_configs
  for all to authenticated using (true) with check (true);

-- Column views: read own + global; write own; admin can set global
create policy "dvt_auth_views_select" on dvt_column_views
  for select to authenticated
  using (is_global = true or created_by = auth.uid());

create policy "dvt_auth_views_insert" on dvt_column_views
  for insert to authenticated
  with check (created_by = auth.uid());

create policy "dvt_auth_views_update" on dvt_column_views
  for update to authenticated
  using (created_by = auth.uid());

create policy "dvt_auth_views_delete" on dvt_column_views
  for delete to authenticated
  using (created_by = auth.uid());
