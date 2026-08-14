import type { Metadata } from "next";
import UserRegisterPage from "@/app/(main)/register/user/page";
import { SITE_URL } from "@/app/lib/json-ld";

// Same form as /register/user, kept live under this URL too (the natural post-signup redirect
// target). Canonical points at /register/user so search engines treat this as one page, not
// duplicate content, while both URLs keep working identically for visitors.
export const metadata: Metadata = {
  alternates: { canonical: `${SITE_URL}/register/user` },
};

export default function ProfileSetupPage() {
  return <UserRegisterPage />;
}
