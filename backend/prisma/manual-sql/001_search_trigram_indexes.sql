-- Enables fuzzy / typo-tolerant matching on business name (FR-SEARCH-1) at index speed, and
-- speeds up ILIKE '%term%' lookups used by autocomplete on category/locality/city names.
--
-- Run once, AFTER the initial `npm run prisma:migrate`. It isn't part of the Prisma-generated
-- migration because gin_trgm_ops indexes aren't expressible in schema.prisma without enabling
-- Prisma's postgresqlExtensions preview feature — plain SQL is simpler and version-stable.
--
-- Apply with: npm run db:search-indexes

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS businesses_name_trgm_idx ON businesses USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS businesses_description_trgm_idx ON businesses USING GIN (description gin_trgm_ops);
CREATE INDEX IF NOT EXISTS categories_name_trgm_idx ON categories USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS localities_name_trgm_idx ON localities USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS cities_name_trgm_idx ON cities USING GIN (name gin_trgm_ops);

-- Supports `keywords && ARRAY[...]` overlap queries used in the relevance score.
CREATE INDEX IF NOT EXISTS businesses_keywords_gin_idx ON businesses USING GIN (keywords);
