-- Migration: Add product_count columns to categories and sub_categories and trigger to maintain count

-- 1. Add product_count columns to taxonomy tables
ALTER TABLE categories ADD COLUMN IF NOT EXISTS product_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE sub_categories ADD COLUMN IF NOT EXISTS product_count INTEGER NOT NULL DEFAULT 0;

-- 2. Create trigger function to maintain active product counts
CREATE OR REPLACE FUNCTION update_product_category_counts()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle DELETED or OLD row when category/sub_category/is_active changed
  IF (TG_OP = 'DELETE' OR TG_OP = 'UPDATE') THEN
    IF OLD.is_active = TRUE THEN
      IF OLD.category_id IS NOT NULL THEN
        UPDATE categories
        SET product_count = (
          SELECT COUNT(*) FROM products WHERE category_id = OLD.category_id AND is_active = TRUE
        )
        WHERE id = OLD.category_id;
      END IF;
      
      IF OLD.sub_category_id IS NOT NULL THEN
        UPDATE sub_categories
        SET product_count = (
          SELECT COUNT(*) FROM products WHERE sub_category_id = OLD.sub_category_id AND is_active = TRUE
        )
        WHERE id = OLD.sub_category_id;
      END IF;
    END IF;
  END IF;

  -- Handle INSERTED or NEW row when category/sub_category/is_active changed
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    IF NEW.is_active = TRUE THEN
      IF NEW.category_id IS NOT NULL THEN
        UPDATE categories
        SET product_count = (
          SELECT COUNT(*) FROM products WHERE category_id = NEW.category_id AND is_active = TRUE
        )
        WHERE id = NEW.category_id;
      END IF;
      
      IF NEW.sub_category_id IS NOT NULL THEN
        UPDATE sub_categories
        SET product_count = (
          SELECT COUNT(*) FROM products WHERE sub_category_id = NEW.sub_category_id AND is_active = TRUE
        )
        WHERE id = NEW.sub_category_id;
      END IF;
    END IF;
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

UPDATE sub_categories sc
SET product_count = (
  SELECT COUNT(*) FROM products p WHERE p.sub_category_id = sc.id AND p.is_active = TRUE
);
