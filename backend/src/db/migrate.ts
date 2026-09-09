import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pool } from './pool';

async function run() {
  await pool.query(readFileSync(join(__dirname, '../../migrations/001_initial.sql'), 'utf8'));
  await pool.end();
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
