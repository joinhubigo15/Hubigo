/** Shared helpers for the autonomous category-batch run: completion check + status log. */
import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync } from "node:fs";
import path from "node:path";
import { loadState } from "./state";
import { CITY_LABEL } from "./types";
import type { City } from "./types";

const CITY_FILES: [City, string][] = [
  ["bangalore", "Bangalore_pincode.txt"],
  ["chennai", "../Chennai_Pincode.txt"],
  ["hyderabad", "../Hyderabad_Pincode.txt"],
];

function pincodeCount(file: string): number {
  return readFileSync(file, "utf-8")
    .split(/[,\r\n]+/)
    .map((s) => s.trim())
    .filter(Boolean).length;
}

export function isSubcategoryComplete(subcategory: string): boolean {
  const state = loadState();
  const completedKeys = new Set(Object.keys(state.completed).filter((k) => k.startsWith(subcategory + "|")));
  for (const [city, file] of CITY_FILES) {
    const total = pincodeCount(file);
    const done = [...completedKeys].filter((k) => k.split("|")[1] === city).length;
    if (done < total) return false;
  }
  return true;
}

const STATUS_LOG_PATH = path.join(__dirname, "staging", "category-batch-status.jsonl");

export interface StatusEntry {
  timestamp: string;
  sector: string;
  subcategory: string;
  leadCount: number;
  creditsSpent: number;
  outputFile: string;
  action: "completed" | "skipped-already-done";
}

export function appendStatus(entry: StatusEntry): void {
  mkdirSync(path.dirname(STATUS_LOG_PATH), { recursive: true });
  appendFileSync(STATUS_LOG_PATH, JSON.stringify(entry) + "\n", "utf-8");
}

export function statusLogPath(): string {
  return STATUS_LOG_PATH;
}
