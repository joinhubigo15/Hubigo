/** Presentational-only icon/color per top-level category slug — names, slugs, and counts always
 * come from the real /api/v1/categories endpoint; this just decorates them. */
export const CATEGORY_VISUALS: Record<string, { icon: string; color: string }> = {
  "automotive-services": { icon: "🚗", color: "#64748B" },
  "beauty-and-wellness": { icon: "💇", color: "#EC4899" },
  "education-and-training": { icon: "📚", color: "#14B8A6" },
  "entertainment-and-leisure": { icon: "🎉", color: "#D946EF" },
  "events-and-wedding-services": { icon: "💍", color: "#F97316" },
  "fashion-and-tailoring": { icon: "👗", color: "#A855F7" },
  "food-and-beverage": { icon: "🍽️", color: "#F43F5E" },
  "healthcare-and-medical": { icon: "🏥", color: "#10B981" },
  "home-services": { icon: "🏠", color: "#0EA5E9" },
  "it-and-digital-services": { icon: "💻", color: "#3B82F6" },
  "proffessional-services": { icon: "⚖️", color: "#78716C" },
  "repair-services": { icon: "🔧", color: "#EAB308" },
  "retail-stores": { icon: "🛍️", color: "#8B5CF6" },
  "sports-and-fitness": { icon: "💪", color: "#F59E0B" },
  "travel-and-accommodation": { icon: "✈️", color: "#06B6D4" },
};

export const DEFAULT_CATEGORY_VISUAL = { icon: "🏢", color: "#6366F1" };

export function getCategoryVisual(slug: string) {
  return CATEGORY_VISUALS[slug] ?? DEFAULT_CATEGORY_VISUAL;
}
