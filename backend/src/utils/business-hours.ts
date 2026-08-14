/**
 * business_hours (structured) is empty for the entire imported dataset — the importer only ever
 * stored the scraper's raw text into Business.openHoursRaw (see business-writer.ts's docstring).
 * The SQL-computed is_open_now in business.repository.ts therefore always evaluates false for
 * every business, showing "Closed" everywhere regardless of actual hours. This parses that raw
 * JSON-of-day-ranges text (e.g. '{"Monday":["11 AM–10 PM"]}') as a best-effort fallback so the
 * open/closed badge reflects something real instead of always-false.
 */

export function getCurrentIstDayAndTime(): { day: string; minutesOfDay: number } {
  const now = new Date();
  const day = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Kolkata", weekday: "long" })
    .format(now)
    .toLowerCase();
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(now);
  const [h, m] = time.split(":").map(Number);
  return { day, minutesOfDay: h * 60 + m };
}

function parseTimeToken(token: string, fallbackMeridiem: "AM" | "PM" | null): number | null {
  const match = token.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = match[3] === undefined && match[2] === undefined ? 0 : Number(match[2] ?? 0);
  const meridiem = (match[3]?.toUpperCase() as "AM" | "PM" | undefined) ?? fallbackMeridiem;
  if (!meridiem) return null;
  if (hour === 12) hour = 0; // 12 AM -> 0h, 12 PM handled by +12 below
  if (meridiem === "PM") hour += 12;
  return hour * 60 + minute;
}

function parseRange(rangeStr: string): { openMin: number; closeMin: number } | null {
  if (/closed/i.test(rangeStr)) return null;
  const parts = rangeStr.split(/[–\-]/).map((s) => s.trim());
  if (parts.length !== 2) return null;
  const [startTok, endTok] = parts;
  const endMeridiem = (endTok.match(/AM|PM/i)?.[0]?.toUpperCase() as "AM" | "PM" | undefined) ?? null;
  const startMeridiem = (startTok.match(/AM|PM/i)?.[0]?.toUpperCase() as "AM" | "PM" | undefined) ?? endMeridiem;
  const openMin = parseTimeToken(startTok, startMeridiem);
  const closeMin = parseTimeToken(endTok, endMeridiem ?? startMeridiem);
  if (openMin === null || closeMin === null) return null;
  return { openMin, closeMin };
}

function formatMinutes(min: number): string {
  const h24 = Math.floor(min / 60) % 24;
  const m = min % 60;
  const period = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

export interface OpenStatus {
  isOpenNow: boolean | null;
  closesAt: string | null;
}

interface StructuredHourRow {
  day: string;
  openTime: string | null;
  closeTime: string | null;
  isClosed: boolean;
}

const DAY_ORDER = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
export type LowerDayOfWeek = (typeof DAY_ORDER)[number];

interface ParsedDay {
  openTime: string | null; // "HH:mm", 24h
  closeTime: string | null;
  isClosed: boolean;
}

/** Resolves one day's raw range array (e.g. ["11 AM–10 PM"], ["Closed"], ["24 hours"]) into a
 * single open/close pair. Only the first parseable range is used — the scraped data is never
 * multi-shift (e.g. a lunch-break split), so there's nothing meaningful to pick between. */
function resolveDayRanges(ranges: unknown[]): ParsedDay | null {
  const strings = ranges.filter((r): r is string => typeof r === "string");
  if (strings.length === 0) return null;
  if (strings.some((r) => /closed/i.test(r))) return { openTime: null, closeTime: null, isClosed: true };
  if (strings.some((r) => /24\s*hours?/i.test(r))) return { openTime: "00:00", closeTime: "23:59", isClosed: false };

  for (const r of strings) {
    const range = parseRange(r);
    if (range) return { openTime: formatMinutes24(range.openMin), closeTime: formatMinutes24(range.closeMin), isClosed: false };
  }
  return null;
}

function formatMinutes24(min: number): string {
  const h = Math.floor(min / 60) % 24;
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export interface WeeklyHours {
  rows: { day: LowerDayOfWeek; openTime: string | null; closeTime: string | null; isClosed: boolean }[];
  /** True when only one day's hours were present in the source data and every day below is that
   * single day's hours replicated across the week — callers should surface a "please confirm
   * hours" note in that case, since real per-day hours are just a guess. */
  inferredFromSingleDay: boolean;
}

/** Turns the scraper's raw per-day JSON text into a full 7-day structured schedule, replicating
 * a lone known day across the rest of the week when that's all the source data has (flagged via
 * `inferredFromSingleDay` so the UI can caveat it) — used both to backfill BusinessHours and to
 * compute the same "please confirm hours" flag live off Business.openHoursRaw with no schema
 * change needed for that flag. Returns null if the raw text has no parseable day at all. */
export function parseWeeklyHoursFromRaw(raw: string | null | undefined): WeeklyHours | null {
  if (!raw) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;

  const dict = parsed as Record<string, unknown>;
  const byDay = new Map<LowerDayOfWeek, ParsedDay>();

  for (const day of DAY_ORDER) {
    const key = Object.keys(dict).find((k) => k.toLowerCase() === day);
    if (!key) continue;
    const value = dict[key];
    const ranges = Array.isArray(value) ? value : typeof value === "string" ? [value] : [];
    const resolved = resolveDayRanges(ranges);
    if (resolved) byDay.set(day, resolved);
  }

  if (byDay.size === 0) return null;

  if (byDay.size === 1) {
    const only = [...byDay.values()][0];
    return {
      inferredFromSingleDay: true,
      rows: DAY_ORDER.map((day) => ({ day, ...only })),
    };
  }

  return {
    inferredFromSingleDay: false,
    rows: DAY_ORDER.map((day) => {
      const resolved = byDay.get(day);
      return resolved ? { day, ...resolved } : { day, openTime: null, closeTime: null, isClosed: true };
    }),
  };
}

/** Prefers structured BusinessHours (24h HH:mm, exact) when present; falls back to parsing the
 * scraper's raw text otherwise — structured rows aren't populated yet for the imported dataset,
 * but this keeps the detail endpoint correct once a later phase backfills them. */
export function computeOpenStatus(hours: StructuredHourRow[], raw: string | null | undefined): OpenStatus {
  if (hours.length > 0) {
    const { day, minutesOfDay } = getCurrentIstDayAndTime();
    const today = hours.find((h) => h.day.toLowerCase() === day);
    if (today) {
      if (today.isClosed || !today.openTime || !today.closeTime) return { isOpenNow: false, closesAt: null };
      const [oh, om] = today.openTime.split(":").map(Number);
      const [ch, cm] = today.closeTime.split(":").map(Number);
      const openMin = oh * 60 + om;
      const closeMin = ch * 60 + cm;
      const isOpenNow = minutesOfDay >= openMin && minutesOfDay <= closeMin;
      return { isOpenNow, closesAt: isOpenNow ? formatMinutes(closeMin) : null };
    }
  }
  return computeOpenStatusFromRaw(raw);
}

/** Best-effort open/closed status for right now, parsed from the scraper's raw hours text. */
export function computeOpenStatusFromRaw(raw: string | null | undefined): OpenStatus {
  if (!raw) return { isOpenNow: null, closesAt: null };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { isOpenNow: null, closesAt: null };
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return { isOpenNow: null, closesAt: null };

  const { day, minutesOfDay } = getCurrentIstDayAndTime();
  const dict = parsed as Record<string, unknown>;
  const key = Object.keys(dict).find((k) => k.toLowerCase() === day);
  if (!key) return { isOpenNow: null, closesAt: null };

  const value = dict[key];
  const ranges = Array.isArray(value) ? value : typeof value === "string" ? [value] : [];
  if (ranges.length === 0) return { isOpenNow: null, closesAt: null };
  if (ranges.some((r) => typeof r === "string" && /closed/i.test(r))) return { isOpenNow: false, closesAt: null };
  if (ranges.some((r) => typeof r === "string" && /24\s*hours?/i.test(r))) return { isOpenNow: true, closesAt: null };

  for (const r of ranges) {
    if (typeof r !== "string") continue;
    const range = parseRange(r);
    if (!range) continue;
    const { openMin, closeMin } = range;
    const isOvernight = closeMin < openMin;
    const within = isOvernight
      ? minutesOfDay >= openMin || minutesOfDay <= closeMin
      : minutesOfDay >= openMin && minutesOfDay <= closeMin;
    if (within) return { isOpenNow: true, closesAt: formatMinutes(closeMin) };
  }
  return { isOpenNow: false, closesAt: null };
}
