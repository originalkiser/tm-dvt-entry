-- DVT-Entry Supabase Schema
-- Run this in the Supabase SQL editor when you create your project

-- Locations lookup (seed data)
create table if not exists locations (
  id uuid primary key default gen_random_uuid(),
  location_id text unique not null,
  name text not null,
  sheet_name text not null,
  created_at timestamptz default now()
);

-- Daily entry rows (one row per location per date)
create table if not exists daily_entries (
  id uuid primary key default gen_random_uuid(),
  location_id text not null references locations(location_id),
  entry_date date not null,
  data jsonb not null default '{}',
  confidence jsonb not null default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(location_id, entry_date)
);

-- Column config per location (order + visibility)
create table if not exists column_configs (
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
create index if not exists daily_entries_location_date
  on daily_entries(location_id, entry_date desc);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists daily_entries_updated_at on daily_entries;
create trigger daily_entries_updated_at
  before update on daily_entries
  for each row execute function update_updated_at();

-- Row Level Security
alter table locations enable row level security;
alter table daily_entries enable row level security;
alter table column_configs enable row level security;

-- Allow anon read/write (no auth for V1)
create policy "anon_all_locations" on locations for all to anon using (true) with check (true);
create policy "anon_all_entries"   on daily_entries for all to anon using (true) with check (true);
create policy "anon_all_configs"   on column_configs for all to anon using (true) with check (true);
