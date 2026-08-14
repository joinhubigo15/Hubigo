/**
 * A `next` query param on /login or /register is attacker-controlled (anyone can craft that
 * URL and send it to a victim) and gets passed straight to router.push() after authentication
 * succeeds. Without validation, an absolute or protocol-relative URL (`https://evil.com`,
 * `//evil.com`) would redirect a freshly-authenticated user off-site — a classic open-redirect,
 * often chained with phishing since the URL itself is hubigo.com right up until the bounce.
 * Only a same-origin path (starts with exactly one "/") is allowed through.
 */
export function safeNextPath(raw: string | null): string | null {
  if (!raw) return null;
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return null;
  return raw;
}
