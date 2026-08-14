import type { BusinessDetail } from "@/app/lib/search-api";
import type { FaqEntry } from "@/app/lib/json-ld";

const DAY_ORDER = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;

function dayLabel(day: string): string {
  return day.charAt(0).toUpperCase() + day.slice(1).toLowerCase();
}

function formatTime(time: string | null): string | null {
  if (!time) return null;
  const [hStr, mStr] = time.split(":");
  const h = Number(hStr);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${mStr} ${period}`;
}

/** Mirrors BusinessDetailClient's local openHoursRaw parser (kept independent — this module has
 * no dependency on that client component). Same '{"Monday":["11 AM–10 PM"]}' scraper shape. */
function parseOpenHoursRaw(raw: string | null): { day: string; text: string }[] | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    const rows = DAY_ORDER.map((key) => {
      const match = Object.keys(parsed).find((k) => k.toLowerCase() === key);
      const value = match ? parsed[match] : undefined;
      if (value === undefined) return null;
      const text = Array.isArray(value) ? value.join(", ") : String(value);
      return { day: dayLabel(key), text: text || "Closed" };
    }).filter((r): r is { day: string; text: string } => Boolean(r));
    return rows.length > 0 ? rows : null;
  } catch {
    return null;
  }
}

/** Prefers structured BusinessHours rows (most reliable), falls back to the scraped raw-text
 * hours, matching the same precedence BusinessDetailClient uses for the visible hours widget. */
function buildHoursSentence(business: BusinessDetail): string | null {
  if (business.hours.length > 0) {
    const sorted = DAY_ORDER.map((key) => business.hours.find((h) => h.day.toLowerCase() === key)).filter(
      (h): h is BusinessDetail["hours"][number] => Boolean(h),
    );
    if (sorted.length === 0) return null;
    const parts = sorted.map((h) => {
      const text = h.isClosed ? "Closed" : `${formatTime(h.openTime) ?? "—"}–${formatTime(h.closeTime) ?? "—"}`;
      return `${dayLabel(h.day)}: ${text}`;
    });
    const caveat = business.hoursInferredFromSingleDay
      ? " Hours are based on the data available and may vary by day — please call ahead to confirm."
      : "";
    return `${parts.join(", ")}.${caveat}`;
  }

  const rawRows = parseOpenHoursRaw(business.openHoursRaw);
  if (rawRows) {
    return `${rawRows.map((r) => `${r.day}: ${r.text}`).join(", ")}.`;
  }

  return null;
}

const PRICE_RANGE_LABEL: Record<string, string> = {
  budget: "budget-friendly",
  moderate: "moderately priced",
  premium: "premium",
  luxury: "luxury",
};

/**
 * Derives a real, data-backed FAQ list for one business — every question is only included when
 * the underlying field actually has real data, and every answer is built directly from that
 * field (no invented/generic content). Used identically on the server (to emit FAQPage JSON-LD)
 * and on the client (to render the matching visible accordion) so structured data and visible
 * content can never drift apart.
 */
export function deriveBusinessFaqs(business: BusinessDetail): FaqEntry[] {
  const faqs: FaqEntry[] = [];
  const primaryCategory = business.categories.find((c) => c.isPrimary)?.category ?? null;
  const kind = primaryCategory ? primaryCategory.name : "business";

  // Location — address is a required field, always real. It's already a complete formatted
  // string (street, locality, city, state, pincode, country) straight from the source data, so
  // it's used as-is rather than re-appending city/pincode and producing redundant text.
  faqs.push({
    question: `Where is ${business.name} located?`,
    answer: `${business.name} is located at ${business.address}.`,
  });

  const hoursSentence = buildHoursSentence(business);
  if (hoursSentence) {
    faqs.push({
      question: `What are the opening hours of ${business.name}?`,
      answer: hoursSentence,
    });
  }

  if (business.priceRange) {
    const label = PRICE_RANGE_LABEL[business.priceRange] ?? business.priceRange;
    faqs.push({
      question: `What is the price range at ${business.name}?`,
      answer: `${business.name} is in the ${label} price range.`,
    });
  }

  if (business.services.length > 0) {
    const names = business.services.map((s) => s.name);
    faqs.push({
      question: `What services does ${business.name} offer?`,
      answer: `${business.name} offers: ${names.join(", ")}.`,
    });
  }

  if (business.amenities.length > 0) {
    const names = business.amenities.map((a) => a.amenity.name);
    faqs.push({
      question: `What amenities does ${business.name} offer?`,
      answer: `${business.name} offers the following amenities: ${names.join(", ")}.`,
    });
  }

  const contactChannels: string[] = [];
  if (business.phone) contactChannels.push(`call ${business.phone}`);
  if (business.whatsappPhone) contactChannels.push(`message on WhatsApp at ${business.whatsappPhone}`);
  if (business.website) contactChannels.push(`visit their website at ${business.website}`);
  if (contactChannels.length > 0) {
    faqs.push({
      question: `How can I contact ${business.name}?`,
      answer: `You can ${contactChannels.join(", or ")}.`,
    });
  }

  // Only surfaced as a positive trust signal when true — an unverified listing isn't meaningful
  // FAQ content and reads as a negative signal if given equal prominence to a verified one.
  if (business.isVerified) {
    faqs.push({
      question: `Is ${business.name} a verified business?`,
      answer: `Yes, ${business.name} is a Hubigo-verified ${kind.toLowerCase()}.`,
    });
  }

  return faqs;
}
