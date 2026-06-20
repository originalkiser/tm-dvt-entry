export interface LocationDef {
  id: string        // site code, e.g. "1508-Mesquite-Town E"
  name: string      // display name
  sheetName: string // exact Excel tab name — update to match your workbook
}

// Sourced from TM Operations Site Folders directory.
// Trim or reorder this list to match the exact 22 locations you track.
export const LOCATIONS: LocationDef[] = [
  { id: '1504-Brooklyn',       name: '1504 – Brooklyn (Atlantic)',        sheetName: '1504-Brooklyn-Atlantic' },
  { id: '1505-Hempstead',      name: '1505 – Hempstead (Henry)',          sheetName: '1505-Hempstead-Henry' },
  { id: '1506-Queens',         name: '1506 – Queens (Rockaway)',          sheetName: '1506-Queens-Rockaway' },
  { id: '1507-Miller-Place',   name: '1507 – Miller Place (NY-25A)',      sheetName: '1507-Miller Place-NY-25A' },
  { id: '1508-Mesquite-Town',  name: '1508 – Mesquite (Town E)',          sheetName: '1508-Mesquite-Town E' },
  { id: '1509-Mesquite-Belt',  name: '1509 – Mesquite (N Belt Line)',     sheetName: '1509-Mesquite-N Belt Line' },
  { id: '1510-McKinney',       name: '1510 – McKinney (Stacy)',           sheetName: '1510-McKinney-Stacy' },
  { id: '1511-Allen',          name: '1511 – Allen (W McDermott)',        sheetName: '1511-Allen-W McDermott' },
  { id: '1512-Fort-Mohave',    name: '1512 – Fort Mohave (S Hwy 95)',     sheetName: '1512-Fort Mohave-S Hwy 95' },
  { id: '1513-Memphis-Hickory',name: '1513 – Memphis (Hickory Hill)',     sheetName: '1513-Memphis-Hickory Hill' },
  { id: '1514-Memphis-Get',    name: '1514 – Memphis (Getwell)',          sheetName: '1514-Memphis-Getwell' },
  { id: '1515-Albuquerque',    name: '1515 – Albuquerque (Coors)',        sheetName: '1515-Albuquerque-Coors' },
  { id: '1516-Plano',          name: '1516 – Plano (Ohio)',               sheetName: '1516-Plano-Ohio' },
  { id: '1517-Forney',         name: '1517 – Forney (Kroger)',            sheetName: '1517-Forney-Kroger' },
  { id: '1518-Greenwood',      name: '1518 – Greenwood (Hwy 82)',         sheetName: '1518-Greenwood-Hwy 82' },
  { id: '1519-Greenville',     name: '1519 – Greenville (Hwy 1)',         sheetName: '1519-Greenville-Hwy 1' },
  { id: '1520-Cleveland',      name: '1520 – Cleveland (N Davis)',        sheetName: '1520-Cleveland-N Davis' },
  { id: '1521-Port-Arthur',    name: '1521 – Port Arthur (Hwy 365)',      sheetName: '1521-Port Arthur-Hwy 365' },
  { id: '1522-Groves',         name: '1522 – Groves (39th)',              sheetName: '1522-Groves-39th' },
  { id: '1524-Beaumont',       name: '1524 – Beaumont (Hwy 105)',         sheetName: '1524-Beaumont-Hwy 105' },
  { id: '1525-Breaux-Bridge',  name: '1525 – Breaux Bridge (Rees)',       sheetName: '1525-Breaux Bridge-Rees' },
  { id: '1526-Mansura',        name: '1526 – Mansura (Hwy 1)',            sheetName: '1526-Mansura-Hwy 1' },
  { id: '1527-Carencro',       name: '1527 – Carencro (Wallace)',         sheetName: '1527-Carencro-Wallace' },
  { id: '1528-Dunedin',        name: '1528 – Dunedin (Belcher)',          sheetName: '1528-Dunedin-Belcher' },
  { id: '1529-Largo',          name: '1529 – Largo (Walsingham)',         sheetName: '1529-Largo-Walsingham' },
  { id: '1530-Batesville',     name: '1530 – Batesville (Hwy 6 E)',       sheetName: '1530-Batesville-Hwy 6 E' },
  { id: '1531-Cape-Girardeau', name: '1531 – Cape Girardeau (Bloomfield)',sheetName: '1531-Cape Girardeau-Bloomfield' },
  { id: '1532-Jackson',        name: '1532 – Jackson (E Jackson)',        sheetName: '1532-Jackson-E Jackson' },
]
