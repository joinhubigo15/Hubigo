// One-off QA helper for prisma/description-templates/*.json — not part of the app.
// Usage: node scripts/validate-description-templates.js [file1.json file2.json ...]
// With no args, validates every JSON file in prisma/description-templates/.
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'prisma', 'description-templates');
const args = process.argv.slice(2);
const files = args.length > 0
  ? args.map((f) => (path.isAbsolute(f) ? f : path.join(dir, path.basename(f))))
  : fs.readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => path.join(dir, f));

const bannedPatterns = [
  [/\b(we|we're|we've|our|ours|i'm|i've)\b/i, 'first-person language'],
  [/\baward(s|ed)?\b/i, 'fake achievement/award claim'],
  [/\byears? of experience\b/i, 'years-of-experience claim'],
  [/\bestablished (in|since)\b/i, 'unverifiable founding claim'],
  [/\b(19|20)\d{2}\b/, 'a specific year'],
  [/[$₹]|%\s*off|\bdiscount(s|ed)?\b|\bspecial offers?\b|\bclearance sale\b|\bon sale\b|\bsale price\b|(?<!-)\bfree\b(?!\s+weight)/i, 'pricing/offer/promo language'],
];

let totalIssues = 0;
let totalDescriptions = 0;

for (const file of files) {
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const entry of raw) {
    const { subcategorySlug, descriptions } = entry;
    totalDescriptions += descriptions.length;
    if (descriptions.length !== 20) {
      console.log(`[${path.basename(file)}] ${subcategorySlug}: expected 20 descriptions, got ${descriptions.length}`);
      totalIssues++;
    }
    const seen = new Set();
    descriptions.forEach((desc, i) => {
      const words = desc.trim().split(/\s+/).length;
      if (words < 30 || words > 65) {
        console.log(`[${path.basename(file)}] ${subcategorySlug} #${i + 1}: ${words} words (expected ~35-60)`);
        totalIssues++;
      }
      for (const [re, label] of bannedPatterns) {
        if (re.test(desc)) {
          console.log(`[${path.basename(file)}] ${subcategorySlug} #${i + 1}: matched banned pattern (${label}): "${desc.match(re)[0]}"`);
          totalIssues++;
        }
      }
      const norm = desc.trim().toLowerCase();
      if (seen.has(norm)) {
        console.log(`[${path.basename(file)}] ${subcategorySlug} #${i + 1}: exact duplicate within subcategory`);
        totalIssues++;
      }
      seen.add(norm);
    });
  }
}

console.log(`\nChecked ${totalDescriptions} descriptions across ${files.length} file(s). Issues: ${totalIssues}`);
process.exit(totalIssues > 0 ? 1 : 0);
