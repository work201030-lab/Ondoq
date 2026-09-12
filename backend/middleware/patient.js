import jwt from 'jsonwebtoken';

export function requirePatient(req,res,next){
  const auth=req.headers.authorization||'';
  const token=auth.startsWith('Bearer ')?auth.slice(7):null;
  if(!token)return res.status(401).json({error:'تسجيل دخول المريض مطلوب'});
  try{
    const p=jwt.verify(token,process.env.JWT_SECRET);
    if(p.type!=='patient'||!p.patientAccountId||!p.phone)return res.status(401).json({error:'توكن المريض غير صالح'});
    req.patientAccountId=p.patientAccountId;
    req.patientPhone=p.phone;
    next();
  }catch{return res.status(401).json({error:'توكن المريض غير صالح أو منتهي'});}
}
