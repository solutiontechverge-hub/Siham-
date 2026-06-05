import { query } from '../src/db/index.js';

const ids = [
  'e1000001-0001-4001-8001-000000000001',
  'e1000001-0001-4001-8001-000000000003',
  'e1000001-0001-4001-8001-000000000004',
];

const byIds = await query(
  `SELECT s.id::text AS service_id, s.title AS service_title, s.category_id::text AS category_id, c.title AS category_title
   FROM subcategories s
   INNER JOIN categories c ON c.id = s.category_id
   WHERE s.id::text = ANY($1::text[])`,
  [ids],
);
console.log('by assigned ids:', JSON.stringify(byIds.rows, null, 2));

const all = await query(
  `SELECT s.id::text AS service_id, s.title AS service_title, c.title AS category_title
   FROM subcategories s
   INNER JOIN categories c ON c.id = s.category_id
   ORDER BY c.title, s.title
   LIMIT 30`,
);
console.log('sample subcategories:', JSON.stringify(all.rows, null, 2));

process.exit(0);
