-- Rename Dutch "Haar" category label to English "Hair" for display consistency.
-- Idempotent: catalog seed may already have created "Hair".

DO $$
DECLARE
  hair_id UUID;
  haar_id UUID;
BEGIN
  SELECT id INTO hair_id FROM categories WHERE title = 'Hair' LIMIT 1;
  SELECT id INTO haar_id FROM categories WHERE title = 'Haar' LIMIT 1;

  IF haar_id IS NULL THEN
    RETURN;
  END IF;

  IF hair_id IS NULL THEN
    UPDATE categories SET title = 'Hair' WHERE id = haar_id;
    RETURN;
  END IF;

  UPDATE subcategories
  SET category_id = hair_id
  WHERE category_id = haar_id
    AND NOT EXISTS (
      SELECT 1
      FROM subcategories existing
      WHERE existing.category_id = hair_id
        AND existing.title = subcategories.title
    );

  DELETE FROM subcategories WHERE category_id = haar_id;
  DELETE FROM categories WHERE id = haar_id;
END $$;
