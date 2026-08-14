"use client";

import { notFound } from "next/navigation";

// No slug means there's no business to show a gallery for — this used to render the dynamic
// [slug]/gallery page directly, which silently got stuck on an infinite loading skeleton
// (its useEffect read useParams(), found no slug on this route, and never fired). Nothing in the
// app links here, but a real 404 is the correct behavior for anyone who lands on the bare URL.
export default function GenericBusinessGalleryPage() {
  notFound();
}
