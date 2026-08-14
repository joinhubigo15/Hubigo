import { prisma } from "../../lib/prisma";
import { canonicalSubcategoryName, slugify } from "./taxonomy-slug";

/**
 * Read-only slug -> Category.id map, built once at importer startup. The importer never
 * creates Category rows — that's bootstrap-categories.ts's job, run separately beforehand.
 */
export class CategoryResolver {
  private slugToId = new Map<string, string>();
  private idToName = new Map<string, string>();
  private idToSlug = new Map<string, string>();
  private idToParentId = new Map<string, string | null>();
  private unresolvedLogged = new Set<string>();

  private constructor(
    slugToId: Map<string, string>,
    idToName: Map<string, string>,
    idToSlug: Map<string, string>,
    idToParentId: Map<string, string | null>,
  ) {
    this.slugToId = slugToId;
    this.idToName = idToName;
    this.idToSlug = idToSlug;
    this.idToParentId = idToParentId;
  }

  static async load(): Promise<CategoryResolver> {
    const categories = await prisma.category.findMany({ select: { id: true, slug: true, name: true, parentId: true } });
    const slugToId = new Map(categories.map((c) => [c.slug, c.id] as const));
    const idToName = new Map(categories.map((c) => [c.id, c.name] as const));
    const idToSlug = new Map(categories.map((c) => [c.id, c.slug] as const));
    const idToParentId = new Map(categories.map((c) => [c.id, c.parentId] as const));
    return new CategoryResolver(slugToId, idToName, idToSlug, idToParentId);
  }

  /**
   * The top-level sector id for a resolved category (its own id if it has no parent — the
   * taxonomy is exactly two levels deep, sector -> subcategory). Used to scope the dedup
   * index's phone+coordinates matching to same-sector businesses only — see dedup-index.ts.
   */
  topLevelSectorOf(categoryId: string): string {
    return this.idToParentId.get(categoryId) ?? categoryId;
  }

  get size(): number {
    return this.slugToId.size;
  }

  /** Human-readable Category name for a resolved id, for display in cleaned-data exports. */
  nameOf(categoryId: string): string {
    return this.idToName.get(categoryId) ?? categoryId;
  }

  /** Category.slug for a resolved id — used to look up the common-services pool by subcategory. */
  slugOf(categoryId: string): string | null {
    return this.idToSlug.get(categoryId) ?? null;
  }

  /**
   * Resolves a raw source_subcategory (e.g. "Bakery Database") to an existing Category id.
   * Returns null (never throws) if the taxonomy hasn't been bootstrapped for this term yet —
   * callers should log this as a warning and still insert the business without a category link.
   */
  resolve(rawSourceSubcategory: string): string | null {
    const canonical = canonicalSubcategoryName(rawSourceSubcategory);
    const slug = slugify(canonical);
    const id = this.slugToId.get(slug) ?? null;
    if (!id) this.unresolvedLogged.add(rawSourceSubcategory);
    return id;
  }

  /** Distinct raw source_subcategory values that never resolved, for the run's summary. */
  get unresolved(): string[] {
    return [...this.unresolvedLogged];
  }
}
