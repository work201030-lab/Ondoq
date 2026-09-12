import { Router } from 'express';
import { query } from '../db.js';
const router = Router();

router.get('/clinics/:clinicId', async (req,res)=>{
  try { const r=await query(`SELECT r.id,r.rating,r.comment,r.created_at,d.name doctor_name FROM reviews r JOIN appointments a ON a.id=r.appointment_id LEFT JOIN doctors d ON d.id=a.doctor_id WHERE r.clinic_id=$1 ORDER BY r.created_at DESC LIMIT 50`,[req.params.clinicId]); res.json({reviews:r.rows}); }
  catch(e){console.error(e);res.status(500).json({error:'تعذر تحميل التقييمات'});}
});
router.get('/doctors/:doctorId', async (req,res)=>{
  try { const r=await query(`SELECT r.id,r.rating,r.comment,r.created_at FROM reviews r JOIN appointments a ON a.id=r.appointment_id WHERE a.doctor_id=$1 ORDER BY r.created_at DESC LIMIT 50`,[req.params.doctorId]); res.json({reviews:r.rows}); }
  catch(e){console.error(e);res.status(500).json({error:'تعذر تحميل التقييمات'});}
});
router.post('/public', async (req,res)=>{
  const {appointmentId,reviewToken,rating,comment}=req.body||{};
  const score=Number(rating);
  if(!appointmentId||!reviewToken||![1,2,3,4,5].includes(score)) return res.status(400).json({error:'بيانات التقييم غير مكتملة'});
  try {
    const a=await query(`SELECT id,clinic_id,doctor_id,appointment_date,status FROM appointments WHERE id=$1 AND review_token=$2`,[appointmentId,String(reviewToken)]);
    if(!a.rows.length) return res.status(404).json({error:'رابط التقييم غير صالح'});
    if(a.rows[0].status!=='completed') return res.status(409).json({error:'يمكن إضافة التقييم بعد إكمال الموعد'});
    const r=await query(`INSERT INTO reviews (appointment_id,clinic_id,doctor_id,rating,comment) VALUES ($1,$2,$3,$4,$5) RETURNING id,rating,comment,created_at`,[a.rows[0].id,a.rows[0].clinic_id,a.rows[0].doctor_id,score,comment?String(comment).trim().slice(0,1000):null]);
    res.status(201).json({review:r.rows[0]});
  } catch(e){ if(e.code==='23505') return res.status(409).json({error:'تم تقييم هذا الموعد من قبل'}); console.error(e);res.status(500).json({error:'تعذر حفظ التقييم'}); }
});
export default router;
