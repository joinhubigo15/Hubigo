-- =================================================================
-- HUBIGO POSTGRESQL DATABASE PURIFICATION SCRIPT
-- Purges all non-healthcare business listings, categories, and media from PostgreSQL
-- =================================================================

-- Option 1: Clean Purge (Wipes all non-healthcare business listings)
DELETE FROM "BusinessCategory" 
WHERE "businessId" IN (
  SELECT b.id FROM "Business" b
  LEFT JOIN "Category" c ON b."primaryCategoryName" = c.name
  WHERE c.slug NOT IN ('hospitals', 'diagnostic-labs', 'doctors-clinics', 'pharmacies', 'dentists', 'eye-care', 'physiotherapy', 'veterinary', 'medical-equipment')
    OR (
      b."primaryCategoryName" NOT ILIKE '%Health%' 
      AND b."primaryCategoryName" NOT ILIKE '%Medical%' 
      AND b."primaryCategoryName" NOT ILIKE '%Hospital%' 
      AND b."primaryCategoryName" NOT ILIKE '%Doctor%' 
      AND b."primaryCategoryName" NOT ILIKE '%Clinic%' 
      AND b."primaryCategoryName" NOT ILIKE '%Pharmacy%' 
      AND b."primaryCategoryName" NOT ILIKE '%Diagnostic%'
      AND b."primaryCategoryName" NOT ILIKE '%Dental%'
      AND b."primaryCategoryName" NOT ILIKE '%Eye%'
    )
);

DELETE FROM "Business" 
WHERE id IN (
  SELECT b.id FROM "Business" b
  LEFT JOIN "Category" c ON b."primaryCategoryName" = c.name
  WHERE c.slug NOT IN ('hospitals', 'diagnostic-labs', 'doctors-clinics', 'pharmacies', 'dentists', 'eye-care', 'physiotherapy', 'veterinary', 'medical-equipment')
    OR (
      b."primaryCategoryName" NOT ILIKE '%Health%' 
      AND b."primaryCategoryName" NOT ILIKE '%Medical%' 
      AND b."primaryCategoryName" NOT ILIKE '%Hospital%' 
      AND b."primaryCategoryName" NOT ILIKE '%Doctor%' 
      AND b."primaryCategoryName" NOT ILIKE '%Clinic%' 
      AND b."primaryCategoryName" NOT ILIKE '%Pharmacy%' 
      AND b."primaryCategoryName" NOT ILIKE '%Diagnostic%'
      AND b."primaryCategoryName" NOT ILIKE '%Dental%'
      AND b."primaryCategoryName" NOT ILIKE '%Eye%'
    )
);

-- Option 2: Total Reset (If you want to clear all old tables and re-seed clean healthcare listings)
-- TRUNCATE TABLE "Business", "BusinessCategory", "BusinessAmenity", "BusinessService", "BusinessMedia", "Offer" CASCADE;
