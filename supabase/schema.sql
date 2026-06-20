-- DVT-Entry Schema
-- Runs on the same Supabase project as tm-opsperformance.
-- Tables are prefixed with "dvt_" to avoid conflicts.
-- Run in Supabase SQL Editor after the ops-performance schema is already in place.

-- Location lookup (DVT-specific — ops-performance has its own "locations" table)
create table if not exists dvt_locations (
  id uuid primary key default gen_random_uuid(),
  location_id text unique not null,  -- e.g. "1508-Mesquite-Town"
  name text not null,
  sheet_name text not null,
  created_at timestamptz default now()
);

-- Daily entry rows (one per location per date)
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

-- Column order + visibility config per location
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

-- Auto-update updated_at (reuse function if ops-performance already created it)
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
alter table dvt_locations enable row level security;
alter table dvt_daily_entries enable row level security;
alter table dvt_column_configs enable row level security;

-- Allow anon read/write (no auth for DVT-Entry V1)
drop policy if exists "dvt_anon_locations"     on dvt_locations;
drop policy if exists "dvt_anon_entries"        on dvt_daily_entries;
drop policy if exists "dvt_anon_column_configs" on dvt_column_configs;

create policy "dvt_anon_locations"     on dvt_locations     for all to anon using (true) with check (true);
create policy "dvt_anon_entries"       on dvt_daily_entries for all to anon using (true) with check (true);
create policy "dvt_anon_column_configs" on dvt_column_configs for all to anon using (true) with check (true);
