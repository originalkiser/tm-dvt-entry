-- Seed 22 locations
-- Run after schema.sql
-- ⚠️ Update names and sheet_names to match your actual Excel tab names

insert into locations (location_id, name, sheet_name) values
  ('LOC001', 'Ann Arbor',       'Ann Arbor'),
  ('LOC002', 'Auburn Hills',    'Auburn Hills'),
  ('LOC003', 'Battle Creek',    'Battle Creek'),
  ('LOC004', 'Bay City',        'Bay City'),
  ('LOC005', 'Brighton',        'Brighton'),
  ('LOC006', 'Canton',          'Canton'),
  ('LOC007', 'Clarkston',       'Clarkston'),
  ('LOC008', 'Flint',           'Flint'),
  ('LOC009', 'Grand Blanc',     'Grand Blanc'),
  ('LOC010', 'Grand Rapids',    'Grand Rapids'),
  ('LOC011', 'Holland',         'Holland'),
  ('LOC012', 'Jackson',         'Jackson'),
  ('LOC013', 'Kalamazoo',       'Kalamazoo'),
  ('LOC014', 'Lansing',         'Lansing'),
  ('LOC015', 'Livonia',         'Livonia'),
  ('LOC016', 'Midland',         'Midland'),
  ('LOC017', 'Monroe',          'Monroe'),
  ('LOC018', 'Mount Pleasant',  'Mount Pleasant'),
  ('LOC019', 'Muskegon',        'Muskegon'),
  ('LOC020', 'Portage',         'Portage'),
  ('LOC021', 'Saginaw',         'Saginaw'),
  ('LOC022', 'Sterling Heights','Sterling Heights')
on conflict (location_id) do update
  set name = excluded.name,
      sheet_name = excluded.sheet_name;
