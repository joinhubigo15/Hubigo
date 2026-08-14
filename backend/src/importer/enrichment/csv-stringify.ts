function escapeField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** Minimal RFC4180 CSV writer, matching the parser's escaping rules. */
export function stringifyCsv(columns: string[], rows: Record<string, string>[]): string {
  const lines = [columns.map(escapeField).join(",")];
  for (const row of rows) {
    lines.push(columns.map((col) => escapeField(row[col] ?? "")).join(","));
  }
  return lines.join("\r\n") + "\r\n";
}
