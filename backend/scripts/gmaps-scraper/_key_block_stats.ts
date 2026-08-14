import { parseCsv } from "./csv";
import { readFileSync } from "node:fs";

const rows = parseCsv(readFileSync(__dirname + "/staging/run-summary.csv", "utf-8"));
const perKey: Record<string, number> = {};
for (const r of rows) {
  const m = /via key #(\d+)/.exec(r.note || "");
  if (!m) continue;
  const label = m[1];
  if (Number(label) < 801 || Number(label) > 810) continue;
  perKey[label] = (perKey[label] || 0) + 1;
}
const labels = Object.keys(perKey).map(Number).sort((a, b) => a - b);
let total = 0;
for (const l of labels) {
  console.log(`key #${l}: ${perKey[l]} successful queries`);
  total += perKey[l];
}
console.log(`\nTotal successful queries on block 801-810 so far: ${total}`);
