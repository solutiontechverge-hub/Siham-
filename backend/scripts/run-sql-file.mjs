import { readFileSync } from 'fs';
import { query } from '../src/db/index.js';

const file = process.argv[2];
if (!file) {
  console.error('Usage: node scripts/run-sql-file.mjs <path>');
  process.exit(1);
}

const sql = readFileSync(file, 'utf8');
await query(sql);
console.log(`Executed ${file}`);
process.exit(0);
