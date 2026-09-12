import { Router } from 'express';
import { query } from '../db.js';
import { requireClinic, requireRole } from '../middleware/tenant.js';

const router = Router();

router.get('/dashboard', requireClinic, async (req, res) => {
  const clinicId = req.clinicId;
  const [totals, month, upcoming, revenue, plan] = await Promise.all([
    query(`SELECT
      (SELECT count(*)::int FROM doctors WHERE clinic_id=$1 AND active=true) doctors,
      (SELECT count(*)::int FROM patients WHERE clinic_id=$1) patients,
      (SELECT count(*)::int FROM appointments WHERE clinic_id=$1 AND status <> 'cancelled') appointments`, [clinicId]),
    query(`SELECT count(*)::int appointments, count(*) FILTER (WHERE status='completed')::int completed,
      count(*) FILTER (WHERE status='cancelled')::int cancelled,
      count(*) FILTER (WHERE status='no_show')::int no_show
      FROM appointments WHERE clinic_id=$1 AND appointment_date >= date_trunc('month',CURRENT_DATE)::date
      AND appointment_date < (date_trunc('month',CURRENT_DATE)+interval '1 month')::date`, [clinicId]),
    query(`SELECT count(*)::int count FROM appointments WHERE clinic_id=$1 AND appointment_date >= CURRENT_DATE
      AND appointment_date < CURRENT_DATE + 7 AND status IN ('confirmed')`, [clinicId]),
    query(`SELECT COALESCE(sum(amount_egp) FILTER (WHERE payment_status='paid'),0)::numeric paid_revenue,
      COALESCE(sum(amount_egp) FILTER (WHERE status='completed'),0)::numeric booked_revenue
      FROM appointments WHERE clinic_id=$1 AND appointment_date >= date_trunc('month',CURRENT_DATE)::date
      AND appointment_date < (date_trunc('month',CURRENT_DATE)+interval '1 month')::date`, [clinicId]),
    query(`SELECT s.id,s.status,s.current_period_end,sp.name plan_name,sp.price_egp,sp.max_doctors,sp.max_appointments_month
      FROM subscriptions s JOIN subscription_plans sp ON sp.id=s.plan_id
      WHERE s.clinic_id=$1 ORDER BY s.created_at DESC LIMIT 1`, [clinicId])
  ]);
  res.json({ totals: totals.rows[0], month: month.rows[0], upcoming: upcoming.rows[0], revenue: revenue.rows[0], subscription: plan.rows[0] || null });
});

router.get('/audit', requireClinic, requireRole('owner'), async (req,res)=>{
  const r=await query(`SELECT id,action,entity,entity_id,metadata,created_at FROM audit_logs WHERE clinic_id=$1 ORDER BY created_at DESC LIMIT 100`,[req.clinicId]);
  res.json(r.rows);
});

export default router;
