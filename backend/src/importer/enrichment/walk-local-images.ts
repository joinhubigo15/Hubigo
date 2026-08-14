import fs from "node:fs";
import path from "node:path";

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

/**
 * Deliberately duplicated from scripts/r2-bulk-upload/walk-images.ts (same reasoning as
 * taxonomy-slug.ts: separate concern, src/ vs scripts/, no cross-import). Returns keys
 * exactly as uploaded to R2 (folder name + filename, forward slashes) grouped by top-level
 * folder name — the same key the R2 storage adapter used at upload time.
 */
export function buildImageKeyPoolsByFolder(rootDir: string): Map<string, string[]> {
  const byFolder = new Map<string, string[]>();
  if (!fs.existsSync(rootDir)) return byFolder;

  for (const folder of fs.readdirSync(rootDir, { withFileTypes: true })) {
    if (!folder.isDirectory()) continue;
    const folderPath = path.join(rootDir, folder.name);
    const keys: string[] = [];
    for (const file of fs.readdirSync(folderPath, { withFileTypes: true })) {
      if (!file.isFile()) continue;
      const ext = path.extname(file.name).toLowerCase();
      if (!IMAGE_EXTENSIONS.has(ext)) continue;
      keys.push(`${folder.name}/${file.name}`);
    }
    if (keys.length > 0) byFolder.set(folder.name, keys);
  }

  return byFolder;
}
