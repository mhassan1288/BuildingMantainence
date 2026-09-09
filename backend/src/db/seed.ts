import bcrypt from 'bcryptjs';
import { pool } from './pool';

async function run() {
  const passwordHash = await bcrypt.hash('ChangeMe123!', 12);
  const apartments = ['A-101', 'A-102', 'A-103', 'A-104', 'A-105'];
  const residents = ['Ahmed', 'Hassan', 'Ali', 'Usman', 'Bilal'];
  const apartmentIds: string[] = [];
  for (let index = 0; index < apartments.length; index += 1) {
    const result = await pool.query(
      `INSERT INTO apartments (apartment_number, floor, resident_name, monthly_fee, status)
       VALUES ($1, $2, $3, $4, 'ACTIVE')
       ON CONFLICT (apartment_number) DO UPDATE SET resident_name = EXCLUDED.resident_name
       RETURNING id`,
      [apartments[index], 1, residents[index], 100],
    );
    apartmentIds.push(result.rows[0].id);
  }
  const accounts = [
    ['Admin', 'admin@example.com', 'ADMIN', null],
    ['Manager', 'manager@example.com', 'MANAGER', null],
    ...residents.map((name, index) => [name, `${name.toLowerCase()}@example.com`, 'USER', apartmentIds[index]]),
  ];
  for (const [name, email, role, apartmentId] of accounts) {
    await pool.query(
      `INSERT INTO users (name, email, password_hash, role, apartment_id)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO UPDATE SET apartment_id = EXCLUDED.apartment_id, role = EXCLUDED.role`,
      [name, email, passwordHash, role, apartmentId],
    );
  }
  // Keep a useful local/demo dataset available immediately after seeding.  The
  // previous period is paid and the current period is pending so every
  // dashboard and history screen has both states to exercise.
  const admin = (await pool.query(`SELECT id FROM users WHERE email = 'admin@example.com'`)).rows[0];
  const today = new Date();
  const periods = [0, -1].map((offset) => {
    const date = new Date(today.getFullYear(), today.getMonth() + offset, 1);
    return { month: date.getMonth() + 1, year: date.getFullYear(), status: offset === 0 ? 'PENDING' : 'PAID' };
  });
  for (const apartmentId of apartmentIds) {
    for (const period of periods) {
      await pool.query(
        `INSERT INTO maintenance_fees
          (apartment_id, month, year, amount, status, paid_date, collected_by)
         VALUES ($1, $2, $3, 100, $4,
           CASE WHEN $4 = 'PAID' THEN CURRENT_DATE - INTERVAL '15 days' ELSE NULL END,
           CASE WHEN $4 = 'PAID' THEN $5::uuid ELSE NULL END)
         ON CONFLICT (apartment_id, month, year) DO NOTHING`,
        [apartmentId, period.month, period.year, period.status, admin.id],
      );
    }
  }
  await pool.query(
    `INSERT INTO settings (building_name, default_monthly_fee, currency)
     VALUES ('Building Maintenance', 100, 'USD')
     ON CONFLICT DO NOTHING`,
  );
  await pool.end();
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
