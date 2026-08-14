import type { Metadata } from "next";
import BusinessRegisterPage from "@/app/(main)/business/register/page";
import { SITE_URL } from "@/app/lib/json-ld";

// Same form as /business/register, kept live under this URL too (a friendlier/marketing-facing
// path). Canonical points at /business/register so search engines treat this as one page, not
// duplicate content, while both URLs keep working identically for visitors.
export const metadata: Metadata = {
  alternates: { canonical: `${SITE_URL}/business/register` },
};

export default function AddBusinessPage() {
  return <BusinessRegisterPage />;
}
