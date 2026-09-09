import { NextFunction, Request, Response, Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool';
import { requireAuth, requireRole } from '../auth';

const router = Router();
router.use(requireAuth);

const dashboardPeriod = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
});

const paymentHistoryQuery = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  status: z.enum(['PENDING', 'PAID']).optional(),
  apartmentId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

router.get('/dashboard/resident', requireRole('USER'), async (req, res, next) => {
  try {
    if (!req.user?.apartmentId) {
      return res.status(404).json({ success: false, error: 'No apartment is assigned to this resident' });
    }
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const result = await pool.query(
      `SELECT
         a.id, a.apartment_number AS "apartmentNumber", a.floor,
         a.resident_name AS "residentName", a.contact_number AS "contactNumber",
         a.email, a.monthly_fee AS "monthlyFee", a.status,
         current_fee.amount AS "currentAmount",
         current_fee.status AS "currentStatus",
         current_fee.paid_date AS "currentPaidDate",
         COALESCE(SUM(m.amount) FILTER (WHERE m.status = 'PAID'), 0)::numeric AS "totalPaid",
         COALESCE(SUM(m.amount) FILTER (WHERE m.status = 'PENDING'), 0)::numeric AS "totalPending"
       FROM apartments a
       LEFT JOIN maintenance_fees current_fee
         ON current_fee.apartment_id = a.id
        AND current_fee.month = $2 AND current_fee.year = $3
       LEFT JOIN maintenance_fees m ON m.apartment_id = a.id
       WHERE a.id = $1
       GROUP BY a.id, current_fee.amount, current_fee.status, current_fee.paid_date`,
      [req.user.apartmentId, month, year],
    );
    const row = result.rows[0];
    if (!row) return res.status(404).json({ success: false, error: 'Assigned apartment not found' });
    return res.json({
      success: true,
      data: {
        month,
        year,
        apartment: {
          id: row.id,
          apartmentNumber: row.apartmentNumber,
          floor: row.floor,
          residentName: row.residentName,
          contactNumber: row.contactNumber,
          email: row.email,
          monthlyFee: Number(row.monthlyFee),
          status: row.status,
        },
        currentMonth: {
          amount: row.currentAmount === null ? null : Number(row.currentAmount),
          status: row.currentStatus ?? 'PENDING',
          paidDate: row.currentPaidDate,
        },
        totalPaid: Number(row.totalPaid),
        totalPending: Number(row.totalPending),
      },
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/reports', requireRole('ADMIN', 'MANAGER'), async (req, res, next) => {
  try {
    const now = new Date();
    const period = dashboardPeriod.parse({
      month: req.query.month ?? now.getMonth() + 1,
      year: req.query.year ?? now.getFullYear(),
    });
    const [summary, statuses, apartments] = await Promise.all([
      pool.query(
        `SELECT COUNT(*)::int AS "recordCount",
           COALESCE(SUM(amount), 0)::numeric AS "expectedCollection",
           COALESCE(SUM(amount) FILTER (WHERE status = 'PAID'), 0)::numeric AS collected,
           COALESCE(SUM(amount) FILTER (WHERE status = 'PENDING'), 0)::numeric AS pending
         FROM maintenance_fees WHERE month = $1 AND year = $2`,
        [period.month, period.year],
      ),
      pool.query(
        `SELECT status, COUNT(*)::int AS count, COALESCE(SUM(amount), 0)::numeric AS amount
         FROM maintenance_fees WHERE month = $1 AND year = $2 GROUP BY status ORDER BY status`,
        [period.month, period.year],
      ),
      pool.query(
        `SELECT a.id, a.apartment_number AS "apartmentNumber",
           a.resident_name AS "residentName", COALESCE(f.status, 'MISSING') AS status,
           COALESCE(f.amount, 0)::numeric AS amount
         FROM apartments a
         LEFT JOIN maintenance_fees f ON f.apartment_id = a.id AND f.month = $1 AND f.year = $2
         ORDER BY a.apartment_number`,
        [period.month, period.year],
      ),
    ]);
    const row = summary.rows[0];
    return res.json({
      success: true,
      data: {
        month: period.month, year: period.year,
        recordCount: Number(row.recordCount),
        expectedCollection: Number(row.expectedCollection),
        collected: Number(row.collected), pending: Number(row.pending),
        statusBreakdown: statuses.rows.map((item) => ({ status: item.status, count: Number(item.count), amount: Number(item.amount) })),
        apartmentBreakdown: apartments.rows.map((item) => ({ ...item, amount: Number(item.amount) })),
      },
    });
  } catch (error) { return next(error); }
});

router.get('/dashboard/summary', requireRole('ADMIN', 'MANAGER'), async (req, res, next) => {
  try {
    const now = new Date();
    const period = dashboardPeriod.parse({
      month: req.query.month ?? now.getMonth() + 1,
      year: req.query.year ?? now.getFullYear(),
    });
    const result = await pool.query(
      `SELECT
         (SELECT COUNT(*)::int FROM apartments) AS "totalApartments",
         COALESCE(SUM(amount), 0)::numeric AS "expectedCollection",
         COALESCE(SUM(amount) FILTER (WHERE status = 'PAID'), 0)::numeric AS collected,
         COALESCE(SUM(amount) FILTER (WHERE status = 'PENDING'), 0)::numeric AS pending
       FROM maintenance_fees
       WHERE month = $1 AND year = $2`,
      [period.month, period.year],
    );
    const row = result.rows[0];
    return res.json({
      success: true,
      data: {
        month: period.month,
        year: period.year,
        totalApartments: Number(row.totalApartments),
        expectedCollection: Number(row.expectedCollection),
        collected: Number(row.collected),
        pending: Number(row.pending),
      },
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/users', requireRole('ADMIN', 'MANAGER'), async (_req, res, next) => {
  try {
    const rows = (await pool.query('SELECT id, name, email, role, apartment_id, status FROM users ORDER BY name')).rows;
    return res.json({ success: true, data: rows });
  } catch (error) {
    return next(error);
  }
});

router.get('/apartments', requireRole('ADMIN', 'MANAGER'), async (_req, res, next) => {
  try {
    const rows = (await pool.query(`SELECT ${apartmentSelect} FROM apartments ORDER BY apartment_number`)).rows;
    return res.json({ success: true, data: rows });
  } catch (error) {
    return next(error);
  }
});

const apartmentInput = z.object({
  apartmentNumber: z.string().trim().min(1).max(50),
  floor: z.number().int().min(-10).max(200),
  residentName: z.string().trim().min(1).max(150),
  contactNumber: z.string().trim().max(30).nullable().optional(),
  email: z.string().email().max(254).nullable().optional(),
  monthlyFee: z.number().finite().min(0).max(999999999.99),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
  notes: z.string().max(2000).nullable().optional(),
});

const apartmentSelect = `id, apartment_number AS "apartmentNumber", floor,
  resident_name AS "residentName", contact_number AS "contactNumber", email,
  monthly_fee AS "monthlyFee", status, notes, created_at AS "createdAt", updated_at AS "updatedAt"`;

router.get('/apartments/:id', async (req, res, next) => {
  try {
    const row = (await pool.query(`SELECT ${apartmentSelect} FROM apartments WHERE id = $1`, [req.params.id])).rows[0];
    if (!row) return res.status(404).json({ success: false, error: 'Apartment not found' });
    if (req.user?.role === 'USER' && req.user.apartmentId !== req.params.id) {
      return res.status(403).json({ success: false, error: 'You can only access your apartment' });
    }
    return res.json({ success: true, data: row });
  } catch (error) {
    return next(error);
  }
});

router.post('/apartments', requireRole('ADMIN', 'MANAGER'), async (req, res, next) => {
  try {
    const input = apartmentInput.parse(req.body);
    const row = (await pool.query(
      `INSERT INTO apartments (apartment_number, floor, resident_name, contact_number, email, monthly_fee, status, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING ${apartmentSelect}`,
      [input.apartmentNumber, input.floor, input.residentName, input.contactNumber ?? null, input.email ?? null,
        input.monthlyFee, input.status, input.notes ?? null],
    )).rows[0];
    return res.status(201).json({ success: true, data: row });
  } catch (error) {
    return next(error);
  }
});

const updateApartment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = apartmentInput.partial().parse(req.body);
    const fields = Object.entries(input);
    if (!fields.length) return res.status(400).json({ success: false, error: 'At least one field is required' });
    const columns: Record<string, string> = {
      apartmentNumber: 'apartment_number', floor: 'floor', residentName: 'resident_name',
      contactNumber: 'contact_number', email: 'email', monthlyFee: 'monthly_fee', status: 'status', notes: 'notes',
    };
    const values = fields.map(([, value]) => value ?? null);
    const setClause = fields.map(([key], index) => `${columns[key]} = $${index + 1}`).join(', ');
    const row = (await pool.query(
      `UPDATE apartments SET ${setClause}, updated_at = now() WHERE id = $${values.length + 1} RETURNING ${apartmentSelect}`,
      [...values, req.params.id],
    )).rows[0];
    if (!row) return res.status(404).json({ success: false, error: 'Apartment not found' });
    return res.json({ success: true, data: row });
  } catch (error) {
    return next(error);
  }
};
router.put('/apartments/:id', requireRole('ADMIN', 'MANAGER'), updateApartment);
router.patch('/apartments/:id', requireRole('ADMIN', 'MANAGER'), updateApartment);

router.delete('/apartments/:id', requireRole('ADMIN'), async (req, res, next) => {
  try {
    const result = await pool.query('DELETE FROM apartments WHERE id = $1', [req.params.id]);
    if (!result.rowCount) return res.status(404).json({ success: false, error: 'Apartment not found' });
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

router.get('/maintenance-fees', async (req, res, next) => {
  try {
    const feeSelect = `f.id, f.apartment_id AS "apartmentId",
      a.apartment_number AS "apartmentNumber", a.resident_name AS "residentName",
      f.month, f.year, f.amount, f.status, f.paid_date AS "paidDate",
      f.collected_by AS "collectedBy", f.created_at AS "createdAt", f.updated_at AS "updatedAt"`;
    if (req.user?.role === 'USER' && !req.user.apartmentId) {
      return res.json({ success: true, data: [] });
    }
    const query = req.user?.role === 'USER'
      ? [`SELECT ${feeSelect} FROM maintenance_fees f JOIN apartments a ON a.id = f.apartment_id WHERE f.apartment_id = $1 ORDER BY f.year DESC, f.month DESC`, [req.user.apartmentId]]
      : [`SELECT ${feeSelect} FROM maintenance_fees f JOIN apartments a ON a.id = f.apartment_id ORDER BY f.year DESC, f.month DESC`, []];
    const rows = (await pool.query(query[0] as string, query[1] as string[])).rows;
    return res.json({ success: true, data: rows });
  } catch (error) {
    return next(error);
  }
});

// Read-only history endpoint. Scope is always applied server-side before any
// optional filters, so a resident cannot broaden their assigned apartment.
router.get('/payment-history', async (req, res, next) => {
  try {
    const query = paymentHistoryQuery.parse(req.query);
    if (req.user?.role === 'USER' && !req.user.apartmentId) {
      return res.json({ success: true, data: [], meta: { limit: query.limit, count: 0 } });
    }
    if (req.user?.role === 'USER' && query.apartmentId && query.apartmentId !== req.user.apartmentId) {
      return res.status(403).json({ success: false, error: 'You can only view payment history for your apartment' });
    }
    const values: unknown[] = [];
    const conditions: string[] = [];
    const add = (value: unknown) => { values.push(value); return `$${values.length}`; };
    if (req.user?.role === 'USER') conditions.push(`f.apartment_id = ${add(req.user.apartmentId)}`);
    else if (query.apartmentId) conditions.push(`f.apartment_id = ${add(query.apartmentId)}`);
    if (query.month !== undefined) conditions.push(`f.month = ${add(query.month)}`);
    if (query.year !== undefined) conditions.push(`f.year = ${add(query.year)}`);
    if (query.status) conditions.push(`f.status = ${add(query.status)}`);
    const limit = add(query.limit);
    const rows = (await pool.query(
      `SELECT f.id, f.apartment_id AS "apartmentId", a.apartment_number AS "apartmentNumber",
         a.resident_name AS "residentName", f.month, f.year, f.amount, f.status,
         f.paid_date AS "paidDate", f.collected_by AS "collectedBy",
         collector.name AS "collectorName", f.created_at AS "createdAt"
       FROM maintenance_fees f
       JOIN apartments a ON a.id = f.apartment_id
       LEFT JOIN users collector ON collector.id = f.collected_by
       ${conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''}
       ORDER BY f.year DESC, f.month DESC, f.created_at DESC
       LIMIT ${limit}`,
      values,
    )).rows;
    return res.json({ success: true, data: rows, meta: { limit: query.limit, count: rows.length } });
  } catch (error) { return next(error); }
});

const maintenanceInput = z.object({
  apartmentId: z.string().uuid(),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
  amount: z.number().finite().min(0).max(999999999.99),
  status: z.enum(['PENDING', 'PAID']).default('PENDING'),
});
const maintenanceSelect = `id, apartment_id AS "apartmentId", month, year, amount,
  status, paid_date AS "paidDate", collected_by AS "collectedBy", created_at AS "createdAt", updated_at AS "updatedAt"`;

router.get('/maintenance-fees/:id', async (req, res, next) => {
  try {
    const row = (await pool.query(`SELECT ${maintenanceSelect} FROM maintenance_fees WHERE id = $1`, [req.params.id])).rows[0];
    if (!row) return res.status(404).json({ success: false, error: 'Maintenance record not found' });
    if (req.user?.role === 'USER' && req.user.apartmentId !== row.apartmentId) {
      return res.status(403).json({ success: false, error: 'You can only access maintenance records for your apartment' });
    }
    return res.json({ success: true, data: row });
  } catch (error) { return next(error); }
});

router.post('/maintenance-fees', requireRole('ADMIN', 'MANAGER'), async (req, res, next) => {
  try {
    const input = maintenanceInput.parse(req.body);
    const row = (await pool.query(
      `INSERT INTO maintenance_fees (apartment_id, month, year, amount, status, paid_date, collected_by)
       VALUES ($1, $2, $3, $4, $5, CASE WHEN $5 = 'PAID' THEN CURRENT_DATE ELSE NULL END,
         CASE WHEN $5 = 'PAID' THEN $6::uuid ELSE NULL END)
       RETURNING ${maintenanceSelect}`,
      [input.apartmentId, input.month, input.year, input.amount, input.status, req.user?.id],
    )).rows[0];
    return res.status(201).json({ success: true, data: row });
  } catch (error) { return next(error); }
});

const updateMaintenance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = maintenanceInput.partial().parse(req.body);
    const fields = Object.entries(input);
    if (!fields.length) return res.status(400).json({ success: false, error: 'At least one field is required' });
    const columns: Record<string, string> = { apartmentId: 'apartment_id', month: 'month', year: 'year', amount: 'amount', status: 'status' };
    const values = fields.map(([, value]) => value);
    const setClause = fields.map(([key], index) => `${columns[key]} = $${index + 1}`).join(', ');
    const statusIndex = fields.findIndex(([key]) => key === 'status');
    const paidClause = statusIndex >= 0
     ? `, paid_date = CASE WHEN $${statusIndex + 1} = 'PAID' THEN CURRENT_DATE ELSE NULL END,
          collected_by = CASE WHEN $${statusIndex + 1} = 'PAID' THEN $${values.length + 2}::uuid ELSE NULL END`
     : '';
    const row = (await pool.query(
      `UPDATE maintenance_fees SET ${setClause}${paidClause}, updated_at = now()
       WHERE id = $${values.length + 1} RETURNING ${maintenanceSelect}`,
      statusIndex >= 0 ? [...values, req.params.id, req.user?.id] : [...values, req.params.id],
    )).rows[0];
    if (!row) return res.status(404).json({ success: false, error: 'Maintenance record not found' });
    return res.json({ success: true, data: row });
  } catch (error) { return next(error); }
};
router.patch('/maintenance-fees/:id', requireRole('ADMIN', 'MANAGER'), updateMaintenance);
router.put('/maintenance-fees/:id', requireRole('ADMIN', 'MANAGER'), updateMaintenance);

const paymentStatusInput = z.object({ status: z.enum(['PENDING', 'PAID']) });
router.post('/maintenance-fees/:id/payment-status', requireRole('ADMIN', 'MANAGER'), async (req, res, next) => {
  try {
    const { status } = paymentStatusInput.parse(req.body);
    const row = (await pool.query(
      `UPDATE maintenance_fees
       SET status = $1,
           paid_date = CASE WHEN $1 = 'PAID' THEN CURRENT_DATE ELSE NULL END,
           collected_by = CASE WHEN $1 = 'PAID' THEN $2::uuid ELSE NULL END,
           updated_at = now()
       WHERE id = $3
       RETURNING ${maintenanceSelect}`,
      [status, req.user?.id, req.params.id],
    )).rows[0];
    if (!row) return res.status(404).json({ success: false, error: 'Maintenance record not found' });
    return res.json({ success: true, data: row });
  } catch (error) { return next(error); }
});

router.delete('/maintenance-fees/:id', requireRole('ADMIN', 'MANAGER'), async (req, res, next) => {
  try {
    const result = await pool.query('DELETE FROM maintenance_fees WHERE id = $1', [req.params.id]);
    if (!result.rowCount) return res.status(404).json({ success: false, error: 'Maintenance record not found' });
    return res.status(204).send();
  } catch (error) { return next(error); }
});

router.get('/settings', requireRole('ADMIN', 'MANAGER'), async (_req, res, next) => {
  try {
    const rows = (await pool.query('SELECT * FROM settings ORDER BY created_at DESC')).rows;
    return res.json({ success: true, data: rows });
  } catch (error) {
    return next(error);
  }
});

export default router;
