// QA Validator for backend/prisma/common-services/*.json
// Usage: node scripts/validate-common-services.js [file1.json ...]

const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'prisma', 'common-services');
const args = process.argv.slice(2);

const files = args.length > 0
  ? args.map((f) => (path.isAbsolute(f) ? f : path.join(dir, path.basename(f))))
  : fs.readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => path.join(dir, f));

// Canonical slugify implementation (matching taxonomy-slug.ts)
function slugify(name) {
  return name
    .toLowerCase()
    .replace(/'/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const bannedPatterns = [
  [/\b(we|we're|we've|our|ours|i'm|i've|my|us)\b/i, 'first-person language'],
  [/\b(best|top rated|#1|guaranteed|cheap|cheapest)\b/i, 'subjective / promo claim'],
  [/[$₹]|%\s*off|\bdiscount(s|ed)?\b|\bspecial offers?\b|\bon sale\b|\bsale price\b|(?<!-)\bfree\b(?!\s*sugar|\s*alcohol|\s*streak|\s*wrinkle|\s*blade|\s*frost|\s*paraben)/i, 'pricing / promo language'],
  [/\b(bangalore|bengaluru|mumbai|delhi|chennai|hyderabad|pune|kolkata)\b/i, 'location name'],
];

// Helper to check title case on main words (allowing tech acronyms like iOS, RO, TV, IT, AC, UV, etc.)
function isTitleCase(str) {
  const minorWords = new Set(['and', 'or', 'for', 'of', 'in', 'on', 'at', 'to', 'a', 'an', 'the', '&', 'with', 'via']);
  const knownAcronyms = new Set(['iOS', 'IT', 'TV', 'AC', 'UV', 'RO', 'ID', 'AI', 'PC', 'DJ', '3D', '4D', '5D', 'HD', 'ECG', 'EEG', 'CT', 'MRI', 'IVF', 'IUI', 'ENT', 'PCOS', 'CPAP', 'SMP', 'PFT', 'PTE', 'TOEFL', 'IELTS', 'NEET', 'JEE', 'IIT', 'CA', 'GST', 'TDS', 'ROC', 'LLP', 'MSME', 'SIP', 'EMI', 'OEM', 'RTO', 'ICU', 'OPD', 'CBC', 'PPC', 'OPC', 'TMT', 'AAC', 'LED', 'OLED', 'PCB', 'CCTV', 'GPS', 'EDM', 'VR', 'PS5']);

  const words = str.trim().split(/\s+/);
  for (let i = 0; i < words.length; i++) {
    const rawWord = words[i].replace(/[^a-zA-Z0-9]/g, '');
    if (!rawWord) continue;
    if (knownAcronyms.has(rawWord) || knownAcronyms.has(words[i])) continue;
    const lower = rawWord.toLowerCase();
    if (i === 0 || !minorWords.has(lower)) {
      if (rawWord[0] !== rawWord[0].toUpperCase()) {
        return false;
      }
    }
  }
  return true;
}

let totalIssues = 0;
let totalSubcategories = 0;
let totalServices = 0;
const seenSlugsAcrossFiles = new Map();

for (const file of files) {
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const entry of raw) {
    totalSubcategories++;
    const { subcategorySlug, subcategoryName, services } = entry;

    // 1. Validate Slug alignment
    const expectedSlug = slugify(subcategoryName);
    if (subcategorySlug !== expectedSlug) {
      console.log(`[${path.basename(file)}] ${subcategorySlug}: slug mismatch (expected "${expectedSlug}" for "${subcategoryName}")`);
      totalIssues++;
    }

    // 2. Validate Duplicate Slugs across files
    if (seenSlugsAcrossFiles.has(subcategorySlug)) {
      console.log(`[${path.basename(file)}] ${subcategorySlug}: duplicate slug (already in ${seenSlugsAcrossFiles.get(subcategorySlug)})`);
      totalIssues++;
    } else {
      seenSlugsAcrossFiles.set(subcategorySlug, path.basename(file));
    }

    // 3. Validate Exactly 3 Services
    if (!Array.isArray(services) || services.length !== 3) {
      console.log(`[${path.basename(file)}] ${subcategorySlug}: expected exactly 3 services, got ${services ? services.length : 0}`);
      totalIssues++;
      continue;
    }

    const seenServiceNames = new Set();

    services.forEach((service, i) => {
      totalServices++;
      const name = typeof service === 'string' ? service : service.name;
      const description = typeof service === 'object' ? service.description : null;
      const icon = typeof service === 'object' ? service.icon : null;

      if (!name || typeof name !== 'string') {
        console.log(`[${path.basename(file)}] ${subcategorySlug} #${i + 1}: missing or invalid service name`);
        totalIssues++;
        return;
      }

      // Word count check (2 to 5 words)
      const wordCount = name.trim().split(/\s+/).length;
      if (wordCount < 2 || wordCount > 5) {
        console.log(`[${path.basename(file)}] ${subcategorySlug} #${i + 1} ("${name}"): invalid word count ${wordCount} (expected 2-5 words)`);
        totalIssues++;
      }

      // Title Case check
      if (!isTitleCase(name)) {
        console.log(`[${path.basename(file)}] ${subcategorySlug} #${i + 1} ("${name}"): not Title Case`);
        totalIssues++;
      }

      // Banned patterns check
      for (const [re, label] of bannedPatterns) {
        if (re.test(name)) {
          console.log(`[${path.basename(file)}] ${subcategorySlug} #${i + 1} ("${name}"): matched banned pattern (${label})`);
          totalIssues++;
        }
        if (description && re.test(description)) {
          console.log(`[${path.basename(file)}] ${subcategorySlug} #${i + 1} description: matched banned pattern (${label})`);
          totalIssues++;
        }
      }

      // Duplicate check within subcategory
      const norm = name.trim().toLowerCase();
      if (seenServiceNames.has(norm)) {
        console.log(`[${path.basename(file)}] ${subcategorySlug} #${i + 1} ("${name}"): duplicate service name within subcategory`);
        totalIssues++;
      }
      seenServiceNames.add(norm);

      // Icon check if object
      if (typeof service === 'object' && (!icon || typeof icon !== 'string' || !icon.trim())) {
        console.log(`[${path.basename(file)}] ${subcategorySlug} #${i + 1} ("${name}"): missing or empty icon field`);
        totalIssues++;
      }
    });
  }
}

console.log(`\nChecked ${totalSubcategories} subcategories (${totalServices} services) across ${files.length} file(s). Total Issues: ${totalIssues}`);
process.exit(totalIssues > 0 ? 1 : 0);
