/**
 * Extracts all staged rows for one subcategory into a standalone CSV, same schema as the
 * combined businesses.csv. Usage: tsx build-subcategory-csv.ts "Cafe Database" cafe.csv
 *
 * Streams businesses.csv instead of readFileSync-ing it whole — that file grows all day (170MB+
 * after a long run) and a full readFileSync + parseCsv into an array of row objects was OOM-ing
 * the process. This walks the file in chunks with the same RFC4180 quote-tracking state machine
 * as csv.ts's parseRows, emitting one complete row at a time so memory stays flat regardless of
 * file size.
 */
import { createReadStream, openSync, closeSync, writeSync } from "node:fs";
import { toCsvLine } from "./csv";
import { STAGING_COLUMNS } from "./types";

const [, , subcategory, outFile] = process.argv;
if (!subcategory || !outFile) {
  console.error('Usage: tsx build-subcategory-csv.ts "<Subcategory Database>" <output-filename.csv>');
  process.exit(1);
}

const inPath = "scripts/gmaps-scraper/staging/businesses.csv";
const outPath = `scripts/gmaps-scraper/staging/${outFile}`;

let header: string[] | undefined;
let total = 0;
const byCity: Record<string, number> = {};
let singaporeRows = 0;

const outFd = openSync(outPath, "w");
writeSync(outFd, toCsvLine([...STAGING_COLUMNS]));

function handleRow(row: string[]): void {
  if (header === undefined) {
    header = row;
    return;
  }
  const record: Record<string, string> = {};
  header.forEach((col, i) => {
    record[col] = row[i] ?? "";
  });
  if (record.source_subcategory !== subcategory) return;

  total++;
  byCity[record.source_city] = (byCity[record.source_city] || 0) + 1;
  if ((record.timezone || "").includes("Singapore")) singaporeRows++;

  writeSync(outFd, toCsvLine(STAGING_COLUMNS.map((c) => record[c] ?? "")));
}

// Same state machine as csv.ts's parseRows, adapted to consume a stream of chunks and emit
// complete rows as soon as they're closed, instead of building one giant array up front.
let row: string[] = [];
let field = "";
let inQuotes = false;
let sawAnyContent = false;

function consumeChunk(text: string): void {
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    sawAnyContent = true;

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += ch;
      i++;
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (ch === ",") {
      row.push(field);
      field = "";
      i++;
      continue;
    }
    if (ch === "\r") {
      i++;
      continue;
    }
    if (ch === "\n") {
      row.push(field);
      if (!(row.length === 1 && row[0] === "")) handleRow(row);
      row = [];
      field = "";
      i++;
      continue;
    }
    field += ch;
    i++;
  }
}

async function main() {
  await new Promise<void>((resolve, reject) => {
    const stream = createReadStream(inPath, { encoding: "utf-8", highWaterMark: 1024 * 1024 });
    stream.on("data", (chunk) => consumeChunk(chunk as string));
    stream.on("end", () => {
      if (sawAnyContent && (field.length > 0 || row.length > 0)) {
        row.push(field);
        handleRow(row);
      }
      resolve();
    });
    stream.on("error", reject);
  });

  closeSync(outFd);
  console.log(JSON.stringify({ subcategory, total, byCity, singaporeRows, outPath }));
}

main();
