import {Router} from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {query} from '../db.js';
import {requirePatient} from '../middleware/patient.js';

const router=Router();
const normalizePhone=v=>String(v||'').trim().replace(/\s+/g,'').slice(0,20);
const validPhone=v=>/^[+0-9][0-9().-]{6,19}$/.test(v);
const sign=a=>jwt.sign({type:'patient',patientAccountId:a.id,phone:a.phone},process.env.JWT_SECRET,{expiresIn:process.env.PATIENT_JWT_EXPIRES_IN||'30d'});

router.post('/register',async(req,res)=>{
  const phone=normalizePhone(req.body?.phone), name=String(req.body?.name||'').trim().slice(0,120), email=req.body?.email?String(req.body.email).trim().toLowerCase().slice(0,150):null, password=String(req.body?.password||'');
  if(!validPhone(phone)||name.length<2||password.length<8||password.length>128)return res.status(400).json({error:'أدخل اسمًا صحيحًا ورقم هاتف صحيحًا وكلمة مرور من 8 أحرف على الأقل'});
  try{
    const hash=await bcrypt.hash(password,12);
    const r=await query('INSERT INTO patient_accounts(phone,email,name,password_hash) VALUES($1,$2,$3,$4) RETURNING id,phone,email,name',[phone,email,name,hash]);
    res.status(201).json({token:sign(r.rows[0]),patient:r.rows[0]});
  }catch(e){if(e.code==='23505')return res.status(409).json({error:'يوجد حساب مريض بهذا الرقم بالفعل'});console.error(e);res.status(500).json({error:'تعذر إنشاء حساب المريض'});}
});

router.post('/login',async(req,res)=>{
  const phone=normalizePhone(req.body?.phone),password=String(req.body?.password||'');
  if(!validPhone(phone)||!password)return res.status(400).json({error:'رقم الهاتف وكلمة المرور مطلوبان'});
  try{
    const r=await query('SELECT id,phone,email,name,password_hash FROM patient_accounts WHERE phone=$1',[phone]);
    if(!r.rows.length||!(await bcrypt.compare(password,r.rows[0].password_hash)))return res.status(401).json({error:'رقم الهاتف أو كلمة المرور غير صحيحة'});
    const {password_hash,...patient}=r.rows[0];
    res.json({token:sign(patient),patient});
  }catch(e){console.error(e);res.status(500).json({error:'تعذر تسجيل الدخول'});}
});

router.get('/me',requirePatient,async(req,res)=>{
  const r=await query('SELECT id,phone,email,name,created_at FROM patient_accounts WHERE id=$1',[req.patientAccountId]);
  if(!r.rows.length)return res.status(404).json({error:'الحساب غير موجود'});res.json({patient:r.rows[0]});
});

router.get('/appointments',requirePatient,async(req,res)=>{
  try{
    const r=await query(`SELECT a.id,a.appointment_date,a.appointment_time,a.status,a.payment_status,a.amount_egp,a.notes,a.review_token,
      c.id clinic_id,c.name clinic_name,c.address clinic_address,c.latitude clinic_latitude,c.longitude clinic_longitude,c.logo_url clinic_logo,
      d.id doctor_id,d.name doctor_name,d.specialty,d.photo_url doctor_photo,
      EXISTS(SELECT 1 FROM reviews rv WHERE rv.appointment_id=a.id) AS reviewed
      FROM appointments a JOIN patients p ON p.id=a.patient_id JOIN clinics c ON c.id=a.clinic_id JOIN doctors d ON d.id=a.doctor_id
      WHERE p.phone=$1 ORDER BY a.appointment_date DESC,a.appointment_time DESC LIMIT 100`,[req.patientPhone]);
    res.json({appointments:r.rows});
  }catch(e){console.error(e);res.status(500).json({error:'تعذر تحميل مواعيدك'});}
});


router.post('/request-deletion',async(req,res)=>{
  const phone=normalizePhone(req.body?.phone), email=req.body?.email?String(req.body.email).trim().toLowerCase().slice(0,150):null;
  if(!validPhone(phone) && !email) return res.status(400).json({error:'أدخل رقم الهاتف أو البريد الإلكتروني'});
  try{
    const r=await query('SELECT id FROM patient_accounts WHERE phone=$1 OR ($2::text IS NOT NULL AND email=$2) LIMIT 1',[phone,email]);
    if(r.rows.length) await query("INSERT INTO patient_account_deletion_requests(patient_account_id,phone,email,status) VALUES($1,$2,$3,'requested')",[r.rows[0].id,phone||null,email]);
    res.status(202).json({ok:true,message:'تم استلام طلب حذف حساب المريض. سيتم التحقق من الطلب واستكمال الحذف.'});
  }catch(e){console.error(e);res.status(500).json({error:'تعذر تسجيل طلب الحذف'});}
});

router.delete('/account',requirePatient,async(req,res)=>{
  try{await query('DELETE FROM patient_accounts WHERE id=$1',[req.patientAccountId]);res.json({ok:true,message:'تم حذف حساب المريض'});}catch(e){console.error(e);res.status(500).json({error:'تعذر حذف حساب المريض'});}
});
export default router;
