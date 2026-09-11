-- Migration: Clean duplicate category and subcategory rows and re-link all product & custom_request foreign keys

BEGIN;

-- 1. Re-link products from duplicate category 'half-sarees' to canonical 'half-saree'
UPDATE products
SET category_id = (SELECT id FROM categories WHERE slug = 'half-saree' LIMIT 1)
WHERE category_id IN (SELECT id FROM categories WHERE slug = 'half-sarees');

-- 2. Re-link custom_requests from duplicate category 'half-sarees' to canonical 'half-saree'
UPDATE custom_requests
SET category_id = (SELECT id FROM categories WHERE slug = 'half-saree' LIMIT 1)
WHERE category_id IN (SELECT id FROM categories WHERE slug = 'half-sarees');

-- 3. Re-link sub_categories from duplicate category 'half-sarees' to canonical 'half-saree'
UPDATE sub_categories
SET category_id = (SELECT id FROM categories WHERE slug = 'half-saree' LIMIT 1)
WHERE category_id IN (SELECT id FROM categories WHERE slug = 'half-sarees');

-- 4. Delete duplicate category row 'half-sarees'
DELETE FROM categories WHERE slug = 'half-sarees';

-- 5. Re-link products from duplicate/legacy subcategories to canonical 'salwar-readymade-kurthi'
UPDATE products
SET sub_category_id = (SELECT id FROM sub_categories WHERE slug = 'salwar-readymade-kurthi' LIMIT 1)
WHERE sub_category_id IN (
  SELECT id FROM sub_categories WHERE slug IN ('kurti', 'kurtis', 'readymade-kurthi')
);

-- 6. Re-link custom_requests from duplicate/legacy subcategories to canonical 'salwar-readymade-kurthi'
UPDATE custom_requests
SET sub_category_id = (SELECT id FROM sub_categories WHERE slug = 'salwar-readymade-kurthi' LIMIT 1)
WHERE sub_category_id IN (
  SELECT id FROM sub_categories WHERE slug IN ('kurti', 'kurtis', 'readymade-kurthi')
);

-- 7. Re-link products from unwanted subcategories to parent 'salwar-readymade'
UPDATE products
SET sub_category_id = (SELECT id FROM sub_categories WHERE slug = 'salwar-readymade' LIMIT 1)
WHERE sub_category_id IN (
  SELECT id FROM sub_categories WHERE slug IN ('anarkali', 'crop-top-skirt', 'crop-top-skrit')
);

-- 8. Re-link custom_requests from unwanted subcategories to parent 'salwar-readymade'
UPDATE custom_requests
SET sub_category_id = (SELECT id FROM sub_categories WHERE slug = 'salwar-readymade' LIMIT 1)
WHERE sub_category_id IN (
  SELECT id FROM sub_categories WHERE slug IN ('anarkali', 'crop-top-skirt', 'crop-top-skrit')
);

-- 9. Delete duplicate and unwanted subcategory rows
DELETE FROM sub_categories
WHERE slug IN ('kurti', 'kurtis', 'readymade-kurthi', 'anarkali', 'crop-top-skirt', 'crop-top-skrit');

-- 10. Recalculate materialized product counts
UPDATE categories c
SET product_count = (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.is_active = TRUE);

UPDATE sub_categories sub
SET product_count = (
  SELECT COUNT(*)
  FROM products p
  JOIN sub_categories child ON child.id = p.sub_category_id
  WHERE p.is_active = TRUE
    AND (child.id = sub.id OR child.slug LIKE sub.slug || '-%')
);

COMMIT;
