const path = require('path');
const XLSX = require('xlsx');

const xlsxPath = path.join(__dirname, '../../Categories_Updated.xlsx');
const wb = XLSX.readFile(xlsxPath);
const sheet = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

const header = (rows[0] || []).map((h) => String(h || '').trim().toLowerCase());
const subcategoryCol = header.findIndex((h) => h === 'subcategory');
const sectorCol = header.findIndex((h) => h === 'sector');

function stripDatabaseSuffix(subcategory) {
  return subcategory.replace(/\s*database\s*$/i, '').trim();
}

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/'/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const NAME_CORRECTIONS = {
  'interior designe databaser': 'Interior Design',
};

const SKIP_SUBCATEGORIES = new Set(['desert store']);

const seen = new Set();
const sectorsMap = new Map();

for (const row of rows.slice(1)) {
  const rawSubcategory = row?.[subcategoryCol];
  const rawSector = sectorCol === -1 ? '' : row?.[sectorCol];
  if (!rawSubcategory || typeof rawSubcategory !== 'string') continue;
  let name = stripDatabaseSuffix(rawSubcategory);
  const key = name.toLowerCase();
  if (SKIP_SUBCATEGORIES.has(key)) continue;
  name = NAME_CORRECTIONS[key] ?? name;
  const dedupeKey = name.toLowerCase();
  if (seen.has(dedupeKey)) continue;
  seen.add(dedupeKey);

  const slug = slugify(name);
  const sector = String(rawSector || '').trim();

  if (!sectorsMap.has(sector)) {
    sectorsMap.set(sector, []);
  }
  sectorsMap.get(sector).push({ name, slug });
}

console.log(`Total Unique Subcategories: ${seen.size}`);
console.log(`Total Sectors: ${sectorsMap.size}\n`);

const sectorsSorted = Array.from(sectorsMap.entries()).sort(
  (a, b) => a[1].length - b[1].length
);

for (const [sector, subs] of sectorsSorted) {
  console.log(`Sector: "${sector}" (${subs.length} subcategories)`);
  subs.forEach((s) => console.log(`  - [${s.slug}] ${s.name}`));
}
