-- DVT-Entry seed — insert all 28 site locations
-- Run after schema.sql
-- Trim this list to the exact locations you want to track in DVT-Entry

insert into dvt_locations (location_id, name, sheet_name) values
  ('1504-Brooklyn',        '1504 – Brooklyn (Atlantic)',         '1504-Brooklyn-Atlantic'),
  ('1505-Hempstead',       '1505 – Hempstead (Henry)',           '1505-Hempstead-Henry'),
  ('1506-Queens',          '1506 – Queens (Rockaway)',           '1506-Queens-Rockaway'),
  ('1507-Miller-Place',    '1507 – Miller Place (NY-25A)',       '1507-Miller Place-NY-25A'),
  ('1508-Mesquite-Town',   '1508 – Mesquite (Town E)',           '1508-Mesquite-Town E'),
  ('1509-Mesquite-Belt',   '1509 – Mesquite (N Belt Line)',      '1509-Mesquite-N Belt Line'),
  ('1510-McKinney',        '1510 – McKinney (Stacy)',            '1510-McKinney-Stacy'),
  ('1511-Allen',           '1511 – Allen (W McDermott)',         '1511-Allen-W McDermott'),
  ('1512-Fort-Mohave',     '1512 – Fort Mohave (S Hwy 95)',      '1512-Fort Mohave-S Hwy 95'),
  ('1513-Memphis-Hickory', '1513 – Memphis (Hickory Hill)',      '1513-Memphis-Hickory Hill'),
  ('1514-Memphis-Get',     '1514 – Memphis (Getwell)',           '1514-Memphis-Getwell'),
  ('1515-Albuquerque',     '1515 – Albuquerque (Coors)',         '1515-Albuquerque-Coors'),
  ('1516-Plano',           '1516 – Plano (Ohio)',                '1516-Plano-Ohio'),
  ('1517-Forney',          '1517 – Forney (Kroger)',             '1517-Forney-Kroger'),
  ('1518-Greenwood',       '1518 – Greenwood (Hwy 82)',          '1518-Greenwood-Hwy 82'),
  ('1519-Greenville',      '1519 – Greenville (Hwy 1)',          '1519-Greenville-Hwy 1'),
  ('1520-Cleveland',       '1520 – Cleveland (N Davis)',         '1520-Cleveland-N Davis'),
  ('1521-Port-Arthur',     '1521 – Port Arthur (Hwy 365)',       '1521-Port Arthur-Hwy 365'),
  ('1522-Groves',          '1522 – Groves (39th)',               '1522-Groves-39th'),
  ('1524-Beaumont',        '1524 – Beaumont (Hwy 105)',          '1524-Beaumont-Hwy 105'),
  ('1525-Breaux-Bridge',   '1525 – Breaux Bridge (Rees)',        '1525-Breaux Bridge-Rees'),
  ('1526-Mansura',         '1526 – Mansura (Hwy 1)',             '1526-Mansura-Hwy 1'),
  ('1527-Carencro',        '1527 – Carencro (Wallace)',          '1527-Carencro-Wallace'),
  ('1528-Dunedin',         '1528 – Dunedin (Belcher)',           '1528-Dunedin-Belcher'),
  ('1529-Largo',           '1529 – Largo (Walsingham)',          '1529-Largo-Walsingham'),
  ('1530-Batesville',      '1530 – Batesville (Hwy 6 E)',        '1530-Batesville-Hwy 6 E'),
  ('1531-Cape-Girardeau',  '1531 – Cape Girardeau (Bloomfield)', '1531-Cape Girardeau-Bloomfield'),
  ('1532-Jackson',         '1532 – Jackson (E Jackson)',         '1532-Jackson-E Jackson')
on conflict (location_id) do update
  set name = excluded.name,
      sheet_name = excluded.sheet_name;
