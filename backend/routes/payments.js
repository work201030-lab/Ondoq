import { Router } from 'express';
import { query } from '../db.js';
import { createPaymobPayment } from '../services/payment.js';
import crypto from 'crypto';
import { requireClinic } from '../middleware/tenant.js';

const router = Router();

// بدء عملية دفع لموعد (يرجع رابط توجيه المريض لصفحة الدفع)
router.post('/appointment/:id/pay', requireClinic, async (req, res) => {
  const { gateway = 'paymob' } = req.body;
  const appt = await query(
    `SELECT a.amount_egp, p.name AS patient_name, p.phone AS patient_phone, p.email AS patient_email
     FROM appointments a JOIN patients p ON p.id = a.patient_id
     WHERE a.id=$1 AND a.clinic_id=$2`, [req.params.id, req.clinicId]
  );
  if (!appt.rows.length) return res.status(404).json({ error: 'الموعد غير موجود' });
  const a = appt.rows[0];

  const paymentReference = `appt_${req.params.id}_${crypto.randomUUID()}`;
  try {
    if (gateway !== 'paymob') return res.status(400).json({ error: 'بوابة الدفع المتاحة حاليًا هي Paymob فقط' });
    await query(
      `INSERT INTO appointment_payments (appointment_id, amount_egp, gateway, gateway_transaction_id, status)
       VALUES ($1,$2,$3,$4,'pending')`, [req.params.id, a.amount_egp, gateway, paymentReference]
    );

    const result = await createPaymobPayment({
      amountEGP: a.amount_egp, patientName: a.patient_name,
      patientPhone: a.patient_phone, email: a.patient_email, merchantOrderId: paymentReference,
      description: 'ONDOQ appointment payment',
    });

    res.json({ paymentUrl: result.paymentUrl, paymentReference });
  } catch (err) {
    await query(`UPDATE appointment_payments SET status='failed' WHERE gateway_transaction_id=$1 AND status='pending'`, [paymentReference]).catch(() => {});
    console.error(err.response?.data || err);
    res.status(500).json({ error: 'تعذر بدء عملية الدفع' });
  }
});

export default router;
