import { Router } from 'express';
import { query } from '../db.js';
import { createPaymobPayment } from '../services/payment.js';
import { requireClinic } from '../middleware/tenant.js';
import { requireRole } from '../middleware/tenant.js';
import { audit } from '../services/audit.js';
import crypto from 'crypto';

const router = Router();

router.get('/current', requireClinic, async (req,res)=>{ const r=await query(`SELECT s.id,s.status,s.current_period_start,s.current_period_end,s.cancel_at_period_end,sp.name plan_name,sp.price_egp,sp.max_doctors,sp.max_appointments_month,sp.sms_credits_month,sp.whatsapp_enabled,sp.online_payment_enabled FROM subscriptions s JOIN subscription_plans sp ON sp.id=s.plan_id WHERE s.clinic_id=$1 ORDER BY s.created_at DESC LIMIT 1`,[req.clinicId]); res.json(r.rows[0]||null); });

router.get('/plans', async (req, res) => {
  const plans = await query(`SELECT * FROM subscription_plans ORDER BY price_egp ASC`);
  res.json(plans.rows);
});

// اشتراك عيادة جديدة في خطة (يبدأ بفترة تجريبية 14 يوم قبل أول دفعة)
router.post('/subscribe', requireClinic, async (req, res) => {
  const { planId } = req.body;
  const sub = await query(
    `INSERT INTO subscriptions (clinic_id, plan_id, status, current_period_start, current_period_end)
     VALUES ($1,$2,'trialing', now(), now() + interval '14 days') RETURNING id`,
    [req.clinicId, planId]
  );
  res.json({ subscriptionId: sub.rows[0].id, trialEndsInDays: 14 });
});

// بدء دفع الاشتراك الشهري بعد انتهاء الفترة التجريبية
router.post('/:id/pay', requireClinic, async (req, res) => {
  const sub = await query(
    `SELECT s.id, sp.price_egp, c.name AS clinic_name, c.phone, c.email AS clinic_email
     FROM subscriptions s JOIN subscription_plans sp ON sp.id=s.plan_id
     JOIN clinics c ON c.id = s.clinic_id WHERE s.id=$1 AND s.clinic_id=$2`, [req.params.id, req.clinicId]
  );
  if (!sub.rows.length) return res.status(404).json({ error: 'not found' });
  const s = sub.rows[0];

  const invoice = await query(
    `INSERT INTO subscription_invoices (subscription_id, amount_egp, status) VALUES ($1,$2,'pending') RETURNING id`,
    [s.id, s.price_egp]
  );
  const paymentReference = `sub_${invoice.rows[0].id}_${crypto.randomUUID()}`;
  await query(`UPDATE subscription_invoices SET gateway_transaction_id=$1 WHERE id=$2`, [paymentReference, invoice.rows[0].id]);

  try {
    const result = await createPaymobPayment({
      amountEGP: s.price_egp, patientName: s.clinic_name, patientPhone: s.phone || '01000000000', email: s.clinic_email,
      merchantOrderId: paymentReference, description: `ONDOQ ${s.id} subscription`,
    });
    res.json({ paymentUrl: result.paymentUrl, paymentReference, invoiceId: invoice.rows[0].id });
  } catch (err) {
    await query(`UPDATE subscription_invoices SET status='failed' WHERE id=$1 AND status='pending'`, [invoice.rows[0].id]).catch(() => {});
    console.error(err.response?.data || err);
    res.status(500).json({ error: 'تعذر بدء دفع الاشتراك' });
  }
});

// إلغاء الاشتراك (يفضل شغال لحد آخر يوم في الفترة المدفوعة)
router.post('/:id/cancel', requireClinic, requireRole('owner'), async (req, res) => {
  await query(`UPDATE subscriptions SET cancel_at_period_end=true WHERE id=$1 AND clinic_id=$2`, [req.params.id, req.clinicId]);
  await audit(req,'subscription.cancel_scheduled','subscription',req.params.id);
  res.json({ ok: true });
});

export default router;
