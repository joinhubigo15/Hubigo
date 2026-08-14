/**
 * Normalizes a website URL for storage: ensures a scheme, lowercases the host, strips a
 * trailing slash. Returns null for empty/unparseable input rather than throwing.
 */
export function normalizeWebsite(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const url = new URL(withScheme);
    url.hostname = url.hostname.toLowerCase();
    let result = url.toString();
    if (result.endsWith("/") && url.pathname === "/") {
      result = result.slice(0, -1);
    }
    return result;
  } catch {
    return null;
  }
}
