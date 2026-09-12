import { Router } from 'express';
import express from 'express';
import { query } from '../db.js';
import { verifyPaymobHmac } from '../services/payment.js';

const router = Router();
// Paymob يرسل POST بعد كل محاولة دفع — هنا بنأكد الحجز فعليًا فقط بعد التحقق من الدفع الحقيقي
router.post('/paymob', express.json(), async (req, res) => {
  const data = req.body.obj;
  const hmac = req.query.hmac;

  if (!verifyPaymobHmac(data, hmac)) return res.status(401).send('invalid signature');

  const merchantReference = data.order?.merchant_order_id;
  if (!merchantReference) return res.status(400).send('missing merchant reference');

  const payment = await query(
    `SELECT id, appointment_id, status FROM appointment_payments WHERE gateway_transaction_id=$1 LIMIT 1`,
    [String(merchantReference)]
  );
  if (!payment.rows.length) return res.status(200).send('ignored');

  const row = payment.rows[0];
  if (row.status !== 'pending') return res.sendStatus(200);

  if (data.success === true && data.pending === false) {
    await query(`UPDATE appointment_payments SET status='success', gateway_transaction_id=$1, paid_at=now() WHERE id=$2 AND status='pending'`,
      [String(data.id), row.id]);
    await query(`UPDATE appointments SET payment_status='paid' WHERE id=$1`, [row.appointment_id]);
  } else {
    await query(`UPDATE appointment_payments SET status='failed' WHERE id=$1 AND status='pending'`, [row.id]);
  }
  res.sendStatus(200);
});

// نفس الفكرة لاشتراكات العيادات الشهرية (تجديد تلقائي)
router.post('/paymob/subscription', express.json(), async (req, res) => {
  const data = req.body.obj;
  if (!verifyPaymobHmac(data, req.query.hmac)) return res.status(401).send('invalid signature');

  const merchantReference = data.order?.merchant_order_id;
  if (!merchantReference) return res.status(400).send('missing merchant reference');
  const invoice = await query(
    `SELECT id, subscription_id, status FROM subscription_invoices WHERE gateway_transaction_id=$1 LIMIT 1`,
    [String(merchantReference)]
  );
  if (!invoice.rows.length) return res.status(200).send('ignored');
  const row = invoice.rows[0];
  if (row.status !== 'pending') return res.sendStatus(200);

  if (data.success === true && data.pending === false) {
    await query(
      `UPDATE subscription_invoices SET status='paid', gateway_transaction_id=$1, paid_at=now() WHERE id=$2 AND status='pending'`,
      [String(data.id), row.id]
    );
    await query(
      `UPDATE subscriptions SET status='active', current_period_end = GREATEST(current_period_end, now()) + interval '1 month'
       WHERE id=$1`, [row.subscription_id]
    );
  } else {
    await query(`UPDATE subscription_invoices SET status='failed' WHERE id=$1 AND status='pending'`, [row.id]);
  }
  res.sendStatus(200);
});

export default router;
