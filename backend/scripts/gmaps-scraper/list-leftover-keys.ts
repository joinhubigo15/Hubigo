/**
 * Prints key labels that were barely used before a restricted block got abandoned early — either
 * rejected after only 1-2 attempts (fast-abandon threshold tripped before they got a real shot)
 * or never even tried. None of these are anywhere near their 1000/day quota, unlike keys the
 * daily-cap tracker (exhausted-keys.json) has confirmed genuinely spent for today.
 */
import { loadLeftoverKeys } from "./key-pool";

const labels = loadLeftoverKeys();
if (labels.length === 0) {
  console.log("No barely-used keys recorded yet.");
} else {
  console.log(`${labels.length} barely-used key(s), still have their full daily budget: ${labels.join(", ")}`);
  console.log(`Run a dedicated block with: --key-list ${labels.join(",")}`);
}
