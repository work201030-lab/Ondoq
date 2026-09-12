import { Router } from 'express';
import { query } from '../db.js';
import { notifyBookingConfirmed } from '../services/notify.js';
import { requireClinic, requireRole } from '../middleware/tenant.js';
import { audit } from '../services/audit.js';

const router = Router();

// حجز موعد جديد — الـ UNIQUE constraint في قاعدة البيانات (doctor_id, date, time)
// حجز عام من شاشة اكتشاف العيادات — لا يحتاج تسجيل دخول.
router.post('/public', async (req, res) => {
  const { clinicId, doctorId, patientName, patientPhone, date, time, notes } = req.body || {};
  if (!clinicId || !doctorId || !patientName || !patientPhone || !date || !/^([01]\d|2[0-3]):[0-5]\d$/.test(String(time || ''))) {
    return res.status(400).json({ error: 'بيانات الحجز غير مكتملة' });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date))) return res.status(400).json({ error: 'التاريخ غير صحيح' });
  const [yy,mm,dd]=String(date).split('-').map(Number);
  const dateObj=new Date(Date.UTC(yy,mm-1,dd));
  if(dateObj.getUTCFullYear()!==yy||dateObj.getUTCMonth()!==mm-1||dateObj.getUTCDate()!==dd) return res.status(400).json({ error: 'التاريخ غير صحيح' });
  const normalizedName = String(patientName).trim().slice(0, 120);
  const normalizedPhone = String(patientPhone).trim().slice(0, 20);
  if (normalizedName.length < 2 || normalizedPhone.length < 7) return res.status(400).json({ error: 'بيانات المريض غير صحيحة' });

  try {
    const clinic = await query(`SELECT id,name,status FROM clinics WHERE id=$1 AND status IN ('trial','active')`, [clinicId]);
    if (!clinic.rows.length) return res.status(404).json({ error: 'العيادة غير متاحة' });

    const doctor = await query(`SELECT id,name,price_egp,start_hour,end_hour,slot_minutes,work_days,active
      FROM doctors WHERE id=$1 AND clinic_id=$2 AND active=true`, [doctorId, clinicId]);
    if (!doctor.rows.length) return res.status(404).json({ error: 'الطبيب غير متاح' });
    const d = doctor.rows[0];
    const weekday = new Date(`${date}T12:00:00`).getDay();
    const timeMin = Number(String(time).slice(0,2))*60 + Number(String(time).slice(3,5));
    if (!Array.isArray(d.work_days) || !d.work_days.includes(weekday) || timeMin < d.start_hour*60 || timeMin >= d.end_hour*60 || ((timeMin - d.start_hour*60) % d.slot_minutes !== 0)) {
      return res.status(409).json({ error: 'هذا الموعد خارج ساعات عمل الطبيب' });
    }

    const plan = await query(`SELECT sp.max_appointments_month FROM subscriptions s JOIN subscription_plans sp ON sp.id=s.plan_id
      WHERE s.clinic_id=$1 AND s.status IN ('active','trialing') LIMIT 1`, [clinicId]);
    if (plan.rows[0]?.max_appointments_month != null) {
      const usage = await query(`SELECT count(*)::int n FROM appointments WHERE clinic_id=$1 AND appointment_date >= date_trunc('month', CURRENT_DATE)::date AND appointment_date < (date_trunc('month', CURRENT_DATE) + interval '1 month')::date AND status <> 'cancelled'`, [clinicId]);
      if (usage.rows[0].n >= plan.rows[0].max_appointments_month) return res.status(403).json({ error: 'العيادة وصلت للحد الشهري للحجوزات' });
    }

    const now = await query(`SELECT CURRENT_DATE::text AS today, CURRENT_TIME::time AS now`);
    if (date < now.rows[0].today || (date === now.rows[0].today && String(time) <= String(now.rows[0].now).slice(0,5))) return res.status(409).json({ error: 'لا يمكن حجز موعد في وقت مضى' });

    const patient = await query(`INSERT INTO patients (clinic_id,name,phone) VALUES ($1,$2,$3)
      ON CONFLICT (clinic_id,phone) DO UPDATE SET name=EXCLUDED.name RETURNING id`, [clinicId, normalizedName, normalizedPhone]);
    await query(`UPDATE patient_accounts SET name=$1,updated_at=now() WHERE phone=$2`, [normalizedName, normalizedPhone]);
    const appt = await query(`INSERT INTO appointments (clinic_id,doctor_id,patient_id,appointment_date,appointment_time,amount_egp,notes)
      VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id,review_token`, [clinicId, doctorId, patient.rows[0].id, date, time, d.price_egp, notes ? String(notes).trim().slice(0,1000) : null]);

    try {
      const notificationPlan = await query(`SELECT sp.whatsapp_enabled FROM subscriptions s JOIN subscription_plans sp ON sp.id=s.plan_id WHERE s.clinic_id=$1 AND s.status IN ('active','trialing') LIMIT 1`, [clinicId]);
      await notifyBookingConfirmed({ clinicId, appointmentId: appt.rows[0].id, phone: normalizedPhone, doctorName: d.name, date, time, planAllowsWhatsapp: notificationPlan.rows[0]?.whatsapp_enabled || false });
    } catch (notifyError) { console.error('public booking notification failed', notifyError); }
    res.status(201).json({ appointmentId: appt.rows[0].id, reviewToken: appt.rows[0].review_token, clinicName: clinic.rows[0].name, doctorName: d.name, date, time, priceEGP: d.price_egp });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'الميعاد ده اتحجز لحظة قبلك، اختار ميعاد تاني' });
    console.error(err); res.status(500).json({ error: 'تعذر تأكيد الحجز' });
  }
});

// يمنع أي تعارض حتى لو حصل طلبين في نفس اللحظة (race condition)

router.get('/', requireClinic, async (req,res) => {
  const { date, doctorId, status } = req.query;
  const r = await query(`SELECT a.id,a.appointment_date,a.appointment_time,a.status,a.payment_status,a.amount_egp,a.notes,
    d.id doctor_id,d.name doctor_name,p.id patient_id,p.name patient_name,p.phone patient_phone
    FROM appointments a JOIN doctors d ON d.id=a.doctor_id JOIN patients p ON p.id=a.patient_id
    WHERE a.clinic_id=$1 AND ($2='' OR a.appointment_date=$2::date) AND ($3='' OR a.doctor_id=$3::uuid) AND ($4='' OR a.status=$4)
    ORDER BY a.appointment_date DESC,a.appointment_time ASC LIMIT 200`,[req.clinicId,date||'',doctorId||'',status||'']);
  res.json(r.rows);
});

router.post('/', requireClinic, async (req, res) => {
  const { clinicId } = req;
  const { doctorId, patientName, patientPhone, date, time, notes } = req.body;
  if (!doctorId || !patientName || !patientPhone || !date || !/^\d{2}:\d{2}$/.test(String(time||''))) return res.status(400).json({ error: 'بيانات الحجز غير مكتملة' });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date)) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(String(time))) return res.status(400).json({ error: 'التاريخ أو الوقت غير صحيح' });
  const [yy, mm, dd] = String(date).split('-').map(Number);
  const dateObj = new Date(Date.UTC(yy, mm - 1, dd));
  if (dateObj.getUTCFullYear() !== yy || dateObj.getUTCMonth() !== mm - 1 || dateObj.getUTCDate() !== dd) return res.status(400).json({ error: 'التاريخ غير صحيح' });

  try {
    // upsert للمريض
    const patient = await query(
      `INSERT INTO patients (clinic_id, name, phone) VALUES ($1,$2,$3)
       ON CONFLICT (clinic_id, phone) DO UPDATE SET name=EXCLUDED.name
       RETURNING id`,
      [clinicId, patientName, patientPhone]
    );

    const doctor = await query(`SELECT price_egp, name, active FROM doctors WHERE id=$1 AND clinic_id=$2`, [doctorId, clinicId]);
    if (!doctor.rows.length || !doctor.rows[0].active) return res.status(404).json({ error: 'الطبيب غير موجود أو غير متاح' });

    const plan = await query(
      `SELECT sp.max_appointments_month FROM subscriptions s JOIN subscription_plans sp ON sp.id=s.plan_id
       WHERE s.clinic_id=$1 AND s.status IN ('active','trialing') LIMIT 1`, [clinicId]
    );
    if (plan.rows[0]?.max_appointments_month != null) {
      const usage = await query(`SELECT count(*)::int n FROM appointments WHERE clinic_id=$1 AND appointment_date >= date_trunc('month', CURRENT_DATE)::date AND appointment_date < (date_trunc('month', CURRENT_DATE) + interval '1 month')::date AND status <> 'cancelled'`, [clinicId]);
      if (usage.rows[0].n >= plan.rows[0].max_appointments_month) return res.status(403).json({ error: 'تم الوصول للحد الشهري للمواعيد في خطتك' });
    }

    const appt = await query(
      `INSERT INTO appointments (clinic_id, doctor_id, patient_id, appointment_date, appointment_time, amount_egp, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      [clinicId, doctorId, patient.rows[0].id, date, time, doctor.rows[0].price_egp, notes]
    );

    const notificationPlan = await query(
      `SELECT sp.whatsapp_enabled FROM subscriptions s JOIN subscription_plans sp ON sp.id = s.plan_id
       WHERE s.clinic_id=$1 AND s.status IN ('active','trialing') LIMIT 1`,
      [clinicId]
    );

    try { await notifyBookingConfirmed({
      clinicId, appointmentId: appt.rows[0].id, phone: patientPhone,
      doctorName: doctor.rows[0].name, date, time,
      planAllowsWhatsapp: notificationPlan.rows[0]?.whatsapp_enabled || false,
    }); } catch (notifyError) { console.error('notification failed', notifyError); }

    res.json({ appointmentId: appt.rows[0].id, priceEGP: doctor.rows[0].price_egp });
  } catch (err) {
    if (err.code === '23505') { // unique_violation = تعارض الموعد
      return res.status(409).json({ error: 'الميعاد ده اتحجز لحظة قبلك، اختار ميعاد تاني' });
    }
    console.error(err);
    res.status(500).json({ error: 'حصل خطأ في الحجز' });
  }
});

// المواعيد المتاحة لطبيب في يوم معين (تستبعد المحجوز والماضي)
router.get('/available', requireClinic, async (req, res) => {
  const { doctorId, date } = req.query;
  if (!doctorId || !/^\d{4}-\d{2}-\d{2}$/.test(String(date||''))) return res.status(400).json({ error: 'الطبيب والتاريخ مطلوبان' });
  const doctor = await query(`SELECT start_hour, end_hour, slot_minutes, work_days FROM doctors WHERE id=$1 AND clinic_id=$2 AND active=true`, [doctorId, req.clinicId]);
  if (!doctor.rows.length) return res.status(404).json({ error: 'not found' });
  const d = doctor.rows[0];

  const weekday = new Date(`${date}T12:00:00`).getDay();
  if (!Array.isArray(d.work_days) || !d.work_days.includes(weekday)) return res.json({ slots: [] });
  const booked = await query(
    `SELECT appointment_time FROM appointments WHERE doctor_id=$1 AND appointment_date=$2 AND status != 'cancelled'`,
    [doctorId, date]
  );
  const bookedSet = new Set(booked.rows.map(r => r.appointment_time.slice(0, 5)));

  const slots = [];
  for (let h = d.start_hour; h < d.end_hour; h++) {
    for (let m = 0; m < 60; m += d.slot_minutes) {
      const t = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      if (!bookedSet.has(t)) slots.push(t);
    }
  }
  res.json({ slots });
});

router.patch('/:id/status', requireClinic, requireRole('owner','receptionist'), async (req,res)=>{ const status=String(req.body?.status||''); if(!['confirmed','completed','no_show','cancelled'].includes(status)) return res.status(400).json({error:'حالة الموعد غير صحيحة'}); const r=await query('UPDATE appointments SET status=$1 WHERE id=$2 AND clinic_id=$3 RETURNING id,status',[status,req.params.id,req.clinicId]); if(!r.rows.length)return res.status(404).json({error:'الموعد غير موجود'}); await audit(req,'appointment.status_updated','appointment',r.rows[0].id,{status}); res.json(r.rows[0]); });

router.post('/:id/cancel', requireClinic, async (req, res) => {
  await query(`UPDATE appointments SET status='cancelled' WHERE id=$1 AND clinic_id=$2`, [req.params.id, req.clinicId]);
  res.json({ ok: true });
});

export default router;
