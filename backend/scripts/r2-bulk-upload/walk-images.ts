import fs from "node:fs";
import path from "node:path";

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

export interface LocalImageFile {
  /** Absolute path on disk. */
  absPath: string;
  /** Path relative to the scanned root, using forward slashes (e.g. "bakery/img_01.jpg"). */
  relKey: string;
  sizeBytes: number;
}

/**
 * Recursively walks `rootDir`, returning every image file found, with a root-relative key
 * that preserves the existing folder structure exactly (used verbatim as the R2 object key).
 */
export function walkImages(rootDir: string): LocalImageFile[] {
  const results: LocalImageFile[] = [];

  function walk(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(abs);
        continue;
      }
      const ext = path.extname(entry.name).toLowerCase();
      if (!IMAGE_EXTENSIONS.has(ext)) continue; // skips manifest.json, logs, etc.

      const rel = path.relative(rootDir, abs).split(path.sep).join("/");
      results.push({ absPath: abs, relKey: rel, sizeBytes: fs.statSync(abs).size });
    }
  }

  walk(rootDir);
  return results;
}
