import { Router } from 'express';
import { query } from '../db.js';
import { requireClinic, requireRole } from '../middleware/tenant.js';
const router=Router();
router.get('/',requireClinic,async(req,res)=>{const q=String(req.query.q||'').trim(); const r=await query(`SELECT id,name,phone,email,created_at FROM patients WHERE clinic_id=$1 AND ($2='' OR name ILIKE '%'||$2||'%' OR phone ILIKE '%'||$2||'%') ORDER BY created_at DESC LIMIT 100`,[req.clinicId,q]);res.json(r.rows);});
router.get('/:id',requireClinic,async(req,res)=>{const r=await query('SELECT * FROM patients WHERE id=$1 AND clinic_id=$2',[req.params.id,req.clinicId]);if(!r.rows.length)return res.status(404).json({error:'المريض غير موجود'});res.json(r.rows[0]);});
router.post('/',requireClinic,requireRole('owner','receptionist'),async(req,res)=>{const {name,phone,email}=req.body||{}; if(!String(name||'').trim()||!String(phone||'').trim()) return res.status(400).json({error:'اسم المريض ورقم الهاتف مطلوبان'}); try{const r=await query(`INSERT INTO patients (clinic_id,name,phone,email) VALUES ($1,$2,$3,$4) RETURNING id,name,phone,email,created_at`,[req.clinicId,String(name).trim(),String(phone).trim(),email?String(email).trim().toLowerCase():null]);res.status(201).json(r.rows[0]);}catch(e){if(e.code==='23505')return res.status(409).json({error:'يوجد مريض بنفس رقم الهاتف'});console.error(e);res.status(500).json({error:'تعذر إضافة المريض'});}});
export default router;
