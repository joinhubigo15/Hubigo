// Server-safe (no "use client") — plain JSX, renders straight into the server HTML so crawlers
// see it without executing JS. `data` values must be JSON-serializable and come from real,
// server-fetched fields only.
export default function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
