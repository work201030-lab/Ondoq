import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import axios from 'axios';
import crypto from 'crypto';
import { query } from '../db.js';
import { requireClinic, requireRole } from '../middleware/tenant.js';
const router=Router();
const uploadDir=path.resolve(process.env.UPLOAD_DIR||'uploads');
fs.mkdirSync(uploadDir,{recursive:true});
const allowed=new Set(['image/jpeg','image/png','image/webp']);
const storage=multer.diskStorage({destination:(_,__,cb)=>cb(null,uploadDir),filename:(_,file,cb)=>cb(null,crypto.randomUUID()+path.extname(file.originalname).toLowerCase())});
const upload=multer({storage,limits:{fileSize:5*1024*1024},fileFilter:(_,file,cb)=>cb(null,allowed.has(file.mimetype))});
const publicUrl=req=>`${(process.env.PUBLIC_BASE_URL||`${req.protocol}://${req.get('host')}`).replace(/\/$/,'')}`;
async function storeImage(file,folder){
  if(process.env.CLOUDINARY_CLOUD_NAME&&process.env.CLOUDINARY_UPLOAD_PRESET){
    const body=new FormData();
    body.append('file',new Blob([await fs.promises.readFile(file.path)],{type:file.mimetype}),file.originalname);
    body.append('upload_preset',process.env.CLOUDINARY_UPLOAD_PRESET);
    body.append('folder',folder||'ondoq');
    const r=await axios.post(`https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`,body);
    try{fs.unlinkSync(file.path);}catch{}
    return String(r.data.secure_url).replace('/upload/','/upload/f_auto,q_auto/');
  }
  return null;
}
router.post('/clinic',requireClinic,requireRole('owner'),upload.single('image'),async(req,res)=>{if(!req.file)return res.status(400).json({error:'الصورة غير صالحة أو حجمها أكبر من 5MB'});const url=await storeImage(req.file,'ondoq/clinics')||`${publicUrl(req)}/uploads/${req.file.filename}`;const r=await query(`UPDATE clinics SET logo_url=$1 WHERE id=$2 RETURNING id,logo_url`,[url,req.clinicId]);res.json(r.rows[0]);});

router.post('/clinic/gallery',requireClinic,requireRole('owner'),upload.array('images',6),async(req,res)=>{
  if(!req.files?.length) return res.status(400).json({error:'أضف صورة واحدة على الأقل'});
  const base=publicUrl(req);
  const rows=[];
  for(const file of req.files){ const url=await storeImage(file,'ondoq/clinics')||`${base}/uploads/${file.filename}`; const r=await query(`INSERT INTO clinic_images (clinic_id,image_url) VALUES ($1,$2) RETURNING id,image_url`,[req.clinicId,url]); rows.push(r.rows[0]); }
  res.status(201).json({images:rows});
});
router.delete('/clinic/gallery/:id',requireClinic,requireRole('owner'),async(req,res)=>{const r=await query('DELETE FROM clinic_images WHERE id=$1 AND clinic_id=$2 RETURNING id',[req.params.id,req.clinicId]);if(!r.rows.length)return res.status(404).json({error:'الصورة غير موجودة'});res.json({ok:true});});
router.post('/doctors/:id',requireClinic,requireRole('owner'),upload.single('image'),async(req,res)=>{if(!req.file)return res.status(400).json({error:'الصورة غير صالحة أو حجمها أكبر من 5MB'});const url=await storeImage(req.file,'ondoq/doctors')||`${publicUrl(req)}/uploads/${req.file.filename}`;const r=await query(`UPDATE doctors SET photo_url=$1 WHERE id=$2 AND clinic_id=$3 RETURNING id,name,photo_url`,[url,req.params.id,req.clinicId]);if(!r.rows.length)return res.status(404).json({error:'الطبيب غير موجود'});res.json(r.rows[0]);});
export default router;
