export interface LocationDef {
  id: string;       // e.g. "LOC001"
  name: string;     // display name
  sheetName: string; // exact Excel tab name
}

// ⚠️ Replace these names/sheetNames with your actual 22 location names and Excel tab names
export const LOCATIONS: LocationDef[] = [
  { id: 'LOC001', name: 'Ann Arbor', sheetName: 'Ann Arbor' },
  { id: 'LOC002', name: 'Auburn Hills', sheetName: 'Auburn Hills' },
  { id: 'LOC003', name: 'Battle Creek', sheetName: 'Battle Creek' },
  { id: 'LOC004', name: 'Bay City', sheetName: 'Bay City' },
  { id: 'LOC005', name: 'Brighton', sheetName: 'Brighton' },
  { id: 'LOC006', name: 'Canton', sheetName: 'Canton' },
  { id: 'LOC007', name: 'Clarkston', sheetName: 'Clarkston' },
  { id: 'LOC008', name: 'Flint', sheetName: 'Flint' },
  { id: 'LOC009', name: 'Grand Blanc', sheetName: 'Grand Blanc' },
  { id: 'LOC010', name: 'Grand Rapids', sheetName: 'Grand Rapids' },
  { id: 'LOC011', name: 'Holland', sheetName: 'Holland' },
  { id: 'LOC012', name: 'Jackson', sheetName: 'Jackson' },
  { id: 'LOC013', name: 'Kalamazoo', sheetName: 'Kalamazoo' },
  { id: 'LOC014', name: 'Lansing', sheetName: 'Lansing' },
  { id: 'LOC015', name: 'Livonia', sheetName: 'Livonia' },
  { id: 'LOC016', name: 'Midland', sheetName: 'Midland' },
  { id: 'LOC017', name: 'Monroe', sheetName: 'Monroe' },
  { id: 'LOC018', name: 'Mount Pleasant', sheetName: 'Mount Pleasant' },
  { id: 'LOC019', name: 'Muskegon', sheetName: 'Muskegon' },
  { id: 'LOC020', name: 'Portage', sheetName: 'Portage' },
  { id: 'LOC021', name: 'Saginaw', sheetName: 'Saginaw' },
  { id: 'LOC022', name: 'Sterling Heights', sheetName: 'Sterling Heights' },
]
