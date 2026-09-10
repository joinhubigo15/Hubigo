import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compare Businesses | Hubigo Healthcare",
  description: "Compare ratings, doctors, services, and locations side-by-side on Hubigo.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function CompareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
