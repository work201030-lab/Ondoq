import { Router } from 'express';
import { query } from '../db.js';
import { requireClinic, requireRole } from '../middleware/tenant.js';

const router = Router();

router.post('/assistant', requireClinic, requireRole('owner','receptionist'), async (req,res)=>{
  if (!process.env.OPENAI_API_KEY) return res.status(503).json({error:'مساعد الذكاء الاصطناعي غير مفعّل بعد. أضف OPENAI_API_KEY في إعدادات الخادم.'});
  const question = String(req.body?.question || '').trim().slice(0,2000);
  if (!question) return res.status(400).json({error:'اكتب سؤالك أولاً'});
  try {
    const [stats, doctors, upcoming] = await Promise.all([
      query(`SELECT count(*) FILTER (WHERE status<>'cancelled')::int appointments,
        count(*) FILTER (WHERE status='completed')::int completed,
        count(*) FILTER (WHERE status='cancelled')::int cancelled,
        count(*) FILTER (WHERE status='no_show')::int no_show
        FROM appointments WHERE clinic_id=$1 AND appointment_date >= date_trunc('month',CURRENT_DATE)::date
        AND appointment_date < (date_trunc('month',CURRENT_DATE)+interval '1 month')::date`, [req.clinicId]),
      query(`SELECT count(*)::int total, count(*) FILTER (WHERE active=true)::int active FROM doctors WHERE clinic_id=$1`, [req.clinicId]),
      query(`SELECT count(*)::int count FROM appointments WHERE clinic_id=$1 AND appointment_date>=CURRENT_DATE AND appointment_date<CURRENT_DATE+7 AND status='confirmed'`, [req.clinicId])
    ]);
    const context = JSON.stringify({month:stats.rows[0],doctors:doctors.rows[0],upcoming7days:upcoming.rows[0]});
    const payload = {
      model: process.env.OPENAI_MODEL || 'gpt-5',
      store: false,
      instructions: 'You are ONDOQ Clinic Operations Assistant. Help clinic owners and receptionists manage operations. Use only the supplied aggregate clinic metrics and the user question. Do not diagnose, prescribe, recommend medical treatment, or infer sensitive medical facts. Do not ask for or expose patient names, phone numbers, medical records, or other identifying information. Give practical concise operational advice about scheduling, reminders, staffing, patient-flow, and business metrics. If asked for medical advice, say that a licensed clinician must handle it.',
      input: `Clinic aggregate metrics: ${context}\nUser question: ${question}`
    };
    const r = await fetch('https://api.openai.com/v1/responses', {method:'POST',headers:{'Authorization':`Bearer ${process.env.OPENAI_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify(payload)});
    const data = await r.json().catch(()=>({}));
    if (!r.ok) { console.error('OpenAI error', data); return res.status(502).json({error:'تعذر تشغيل مساعد الذكاء الاصطناعي الآن'}); }
    res.json({answer:data.output_text || 'لم أتمكن من توليد إجابة الآن.'});
  } catch(e){ console.error(e); res.status(500).json({error:'تعذر تشغيل مساعد الذكاء الاصطناعي'}); }
});
export default router;
