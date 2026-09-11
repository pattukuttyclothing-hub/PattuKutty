-- Migration: Add product_count columns to categories and sub_categories and trigger to maintain count

-- 1. Add product_count columns to taxonomy tables
ALTER TABLE categories ADD COLUMN IF NOT EXISTS product_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE sub_categories ADD COLUMN IF NOT EXISTS product_count INTEGER NOT NULL DEFAULT 0;

-- 2. Create trigger function to maintain active product counts (including nested child styles)
CREATE OR REPLACE FUNCTION update_product_category_counts()
RETURNS TRIGGER AS $$
DECLARE
  v_cat_id UUID := COALESCE(NEW.category_id, OLD.category_id);
BEGIN
  IF v_cat_id IS NOT NULL THEN
    -- Update category product count
    UPDATE categories
    SET product_count = (
      SELECT COUNT(*) FROM products WHERE category_id = v_cat_id AND is_active = TRUE
    )
    WHERE id = v_cat_id;

    -- Update sub_categories under this category (rolling up child style products via slug prefix matching)
    UPDATE sub_categories sub
    SET product_count = (
      SELECT COUNT(*)
      FROM products p
      JOIN sub_categories child ON child.id = p.sub_category_id
      WHERE p.category_id = v_cat_id
        AND p.is_active = TRUE
        AND (child.id = sub.id OR child.slug LIKE sub.slug || '-%')
    )
    WHERE sub.category_id = v_cat_id;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 3. Attach trigger to products table
DROP TRIGGER IF EXISTS trg_update_product_category_counts ON products;
CREATE TRIGGER trg_update_product_category_counts
AFTER INSERT OR UPDATE OR DELETE ON products
FOR EACH ROW EXECUTE FUNCTION update_product_category_counts();

-- 4. Initial count backfill for existing rows
UPDATE categories c
SET product_count = (
  SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.is_active = TRUE
);

UPDATE sub_categories sub
SET product_count = (
  SELECT COUNT(*)
  FROM products p
  JOIN sub_categories child ON child.id = p.sub_category_id
  WHERE p.is_active = TRUE
    AND (child.id = sub.id OR child.slug LIKE sub.slug || '-%')
);
