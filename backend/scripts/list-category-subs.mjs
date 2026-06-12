import { query } from '../src/db/index.js';

const r = await query(
  `SELECT c.id::text AS category_id, c.title AS category_title,
          COALESCE(json_agg(json_build_object('id', s.id::text, 'title', s.title) ORDER BY s.title)
            FILTER (WHERE s.id IS NOT NULL), '[]'::json) AS subcategories
   FROM categories c
   LEFT JOIN subcategories s ON s.category_id = c.id
   GROUP BY c.id
   ORDER BY c.title`,
);
console.log(JSON.stringify(r.rows, null, 2));
process.exit(0);
