import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool, query } from '../db.js';
import { requireClinic, requireRole } from '../middleware/tenant.js';

const router = Router();
const sign = user => jwt.sign(
  { userId: user.id, clinicId: user.clinic_id, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
);
const normalizeEmail = value => String(value || '').trim().toLowerCase();
const validSlug = value => /^[a-z0-9][a-z0-9-]{2,79}$/.test(String(value || '').trim().toLowerCase());

router.post('/register', async (req, res) => {
  const { clinicName, slug, name, email, password, phone } = req.body || {};
  const normalizedEmail = normalizeEmail(email);
  const normalizedSlug = String(slug || '').trim().toLowerCase();
  if (!clinicName || !name || !normalizedEmail || !validSlug(normalizedSlug) || !password || password.length < 8 || password.length > 128) {
    return res.status(400).json({ error: 'بيانات التسجيل غير صحيحة. استخدم اسم عيادة وSlug صالحين وكلمة مرور من 8 إلى 128 حرفًا.' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const c = await client.query(
      'INSERT INTO clinics (name,slug,phone,email) VALUES ($1,$2,$3,$4) RETURNING id,name,slug',
      [String(clinicName).trim(), normalizedSlug, phone ? String(phone).trim() : null, normalizedEmail]
    );
    const hash = await bcrypt.hash(password, 12);
    const u = await client.query(
      "INSERT INTO clinic_users (clinic_id,name,email,password_hash,role) VALUES ($1,$2,$3,$4,'owner') RETURNING id,name,email,role,clinic_id",
      [c.rows[0].id, String(name).trim(), normalizedEmail, hash]
    );
    const plan = await client.query('SELECT id FROM subscription_plans ORDER BY price_egp ASC LIMIT 1');
    if (plan.rows[0]) await client.query(
      "INSERT INTO subscriptions (clinic_id,plan_id,status,current_period_start,current_period_end) VALUES ($1,$2,'trialing',now(),now()+interval '14 days')",
      [c.rows[0].id, plan.rows[0].id]
    );
    await client.query('COMMIT');
    res.status(201).json({ token: sign(u.rows[0]), user: u.rows[0], clinic: c.rows[0] });
  } catch (e) {
    await client.query('ROLLBACK');
    if (e.code === '23505') return res.status(409).json({ error: 'البريد أو اسم العيادة مستخدم بالفعل' });
    console.error(e);
    res.status(500).json({ error: 'تعذر إنشاء الحساب' });
  } finally { client.release(); }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !password || String(password).length > 128) return res.status(400).json({ error: 'البريد وكلمة المرور مطلوبان' });
  try {
    const r = await query('SELECT id,clinic_id,name,email,password_hash,role FROM clinic_users WHERE email=$1', [normalizedEmail]);
    if (!r.rows.length || !(await bcrypt.compare(password, r.rows[0].password_hash))) return res.status(401).json({ error: 'البريد أو كلمة المرور غير صحيحة' });
    const { password_hash, ...user } = r.rows[0];
    res.json({ token: sign(user), user });
  } catch (e) { console.error(e); res.status(500).json({ error: 'تعذر تسجيل الدخول' }); }
});

router.post('/request-deletion', async (req, res) => {
  const { email, clinicSlug } = req.body || {};
  const normalizedEmail = normalizeEmail(email);
  const normalizedSlug = String(clinicSlug || '').trim().toLowerCase();
  if (!normalizedEmail || !validSlug(normalizedSlug)) return res.status(400).json({ error: 'بيانات الطلب غير صحيحة' });
  try {
    const r = await query(`SELECT c.id clinic_id, u.id user_id FROM clinics c JOIN clinic_users u ON u.clinic_id=c.id WHERE c.slug=$1 AND u.email=$2 AND u.role='owner' LIMIT 1`, [normalizedSlug, normalizedEmail]);
    // Keep the response generic to avoid account enumeration from the public deletion endpoint.
    if (r.rows.length) {
      await query(`INSERT INTO account_deletion_requests (clinic_id,user_id,email,status) VALUES ($1,$2,$3,'requested')`, [r.rows[0].clinic_id, r.rows[0].user_id, normalizedEmail]);
    }
    res.status(202).json({ ok: true, message: 'تم استلام طلب حذف الحساب. إذا كانت البيانات صحيحة سيتم التواصل معك لاستكمال التحقق والحذف.' });
  } catch (e) { console.error(e); res.status(500).json({ error: 'تعذر تسجيل طلب الحذف' }); }
});

router.delete('/account', requireClinic, requireRole('owner'), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM clinics WHERE id=$1', [req.clinicId]);
    await client.query('COMMIT');
    res.json({ ok: true, message: 'تم حذف حساب العيادة وبياناته' });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error(e);
    res.status(500).json({ error: 'تعذر حذف الحساب' });
  } finally { client.release(); }
});

export default router;
