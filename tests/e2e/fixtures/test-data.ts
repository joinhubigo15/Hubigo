/**
 * Real, existing records pulled directly from the Hubigo database (read-only query), not invented
 * URLs — per the task's instruction to test against real routes/data. If any of these ever 404
 * because the underlying record was deleted/renamed, re-discover fresh ones with a query like:
 *
 *   prisma.business.findFirst({ where: { status: "approved", deletedAt: null }, ... })
 *   prisma.category.findUnique({ where: { slug: "..." }, include: { children: true } })
 *   prisma.city.findMany({ select: { slug: true, name: true } })
 *
 * run from backend/ so Prisma Client resolves. Never re-point these at data requiring auth/PII.
 */
export const TEST_DATA = {
  business: {
    slug: "iskcon-bangalore-bangalore-sznq2h",
    name: "ISKCON Bangalore",
    citySlug: "bangalore",
    // A real service name from this business's services list — used to assert the services
    // section (the interaction under test) actually renders real content, not just an empty state.
    serviceName: "Guided Sightseeing Tours",
  },
  // Deliberately not a real slug shape (no importer ever generates a bare "xyz" suffix like this),
  // so it can never collide with a future real business.
  nonexistentBusinessSlug: "this-definitely-does-not-exist-xyz-999",

  category: {
    slug: "retail-stores",
    name: "Retail Stores",
    // A real subcategory of retail-stores, with a non-trivial business count.
    subcategory: { slug: "grocery-store", name: "Grocery Store" },
  },
  nonexistentCategorySlug: "this-category-does-not-exist-xyz-999",

  city: {
    slug: "bangalore",
    name: "Bangalore",
  },
  nonexistentCitySlug: "this-city-does-not-exist-xyz-999",
};
