import { readdirSync, statSync } from "node:fs";
import path from "node:path";

/** Resolves --input into a flat, sorted list of .csv file paths — single file, or a whole directory tree. */
export function walkInput(inputPath: string): string[] {
  const stat = statSync(inputPath);

  if (stat.isFile()) {
    if (!inputPath.toLowerCase().endsWith(".csv")) {
      throw new Error(`Input file is not a .csv: ${inputPath}`);
    }
    return [inputPath];
  }

  const found: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".csv")) {
        found.push(full);
      }
    }
  };
  walk(inputPath);
  found.sort();
  return found;
}
