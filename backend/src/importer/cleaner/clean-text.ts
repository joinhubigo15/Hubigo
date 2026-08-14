/** Generic text cleanup applied to every string field before validation/normalization. */
export function cleanText(value: string | undefined | null): string {
  if (!value) return "";
  return value
    // Strip C0 control chars (except tab/newline/CR, which the whitespace collapse below
    // handles) and DEL.
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Cleans every string value of a raw row, leaving the shape/keys intact. */
export function cleanRow<T extends Record<string, string>>(row: T): T {
  const cleaned = {} as T;
  for (const key of Object.keys(row) as (keyof T)[]) {
    cleaned[key] = cleanText(row[key]) as T[keyof T];
  }
  return cleaned;
}
