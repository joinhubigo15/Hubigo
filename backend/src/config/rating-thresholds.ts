// Businesses imported with 0 reviews start with no visible rating. Once they accumulate at
// least this many native, APPROVED platform reviews, their displayed rating switches from "no
// rating yet" to a live average computed from those reviews. Businesses that were imported WITH
// a real rating keep that frozen import-time snapshot unchanged — recalculating those against
// native reviews too is deferred to a later version, not this one.
export const NATIVE_RATING_ACTIVATION_THRESHOLD = Number(
  process.env.NATIVE_RATING_ACTIVATION_THRESHOLD ?? 15
);
