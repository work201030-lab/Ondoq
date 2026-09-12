import { Router } from 'express';
import { query } from '../db.js';
import { sendSMS, sendWhatsApp, processDueReminders } from '../services/notify.js';
import { requireClinic, requireRole } from '../middleware/tenant.js';
const router=Router();
router.post('/reminder',requireClinic,requireRole('owner','receptionist'),async(req,res)=>{
  const {appointmentId,channel='sms'}=req.body||{};
  const r=await query(`SELECT a.id,a.appointment_date,a.appointment_time,p.phone,d.name doctor_name,COALESCE(sp.whatsapp_enabled,false) whatsapp_enabled
    FROM appointments a JOIN patients p ON p.id=a.patient_id JOIN doctors d ON d.id=a.doctor_id
    LEFT JOIN subscriptions s ON s.clinic_id=a.clinic_id AND s.status IN ('active','trialing')
    LEFT JOIN subscription_plans sp ON sp.id=s.plan_id WHERE a.id=$1 AND a.clinic_id=$2`,[appointmentId,req.clinicId]);
  if(!r.rows.length)return res.status(404).json({error:'الموعد غير موجود'});
  const a=r.rows[0];
  try{
    if(channel==='whatsapp'){if(!a.whatsapp_enabled)return res.status(403).json({error:'واتساب غير متاح في خطتك'});await sendWhatsApp({clinicId:req.clinicId,appointmentId:a.id,phone:a.phone,params:[a.doctor_name,String(a.appointment_date),String(a.appointment_time).slice(0,5)],notificationType:'manual'});}
    else await sendSMS({clinicId:req.clinicId,appointmentId:a.id,phone:a.phone,message:`تذكير بموعدك عند ${a.doctor_name} يوم ${a.appointment_date} الساعة ${String(a.appointment_time).slice(0,5)}. أوندوك`,notificationType:'manual'});
    res.json({ok:true});
  }catch(e){res.status(502).json({error:'فشل الإرسال'});}
});
router.post('/process-due',requireClinic,requireRole('owner'),async(req,res)=>{res.json({ok:true,sent:await processDueReminders()});});
export default router;
