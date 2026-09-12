import twilio from 'twilio';
import axios from 'axios';
import { query } from '../db.js';

const smsClient = (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN)
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN) : null;
const toPhone = p => String(p||'').startsWith('+') ? String(p) : `+2${String(p||'').replace(/^0/,'0')}`;

export async function sendSMS({ clinicId, appointmentId, phone, message, notificationType='transactional' }) {
  const log = await query(`INSERT INTO notifications_log (clinic_id,appointment_id,channel,recipient_phone,message,status,notification_type)
    VALUES ($1,$2,'sms',$3,$4,'queued',$5) RETURNING id`, [clinicId,appointmentId,phone,message,notificationType]);
  if (!smsClient || !process.env.TWILIO_PHONE_NUMBER) {
    await query(`UPDATE notifications_log SET status='failed' WHERE id=$1`,[log.rows[0].id]);
    return {ok:false, skipped:true, reason:'SMS provider not configured'};
  }
  try {
    const r=await smsClient.messages.create({body:message,from:process.env.TWILIO_PHONE_NUMBER,to:toPhone(phone)});
    await query(`UPDATE notifications_log SET status='sent',provider_message_id=$1,sent_at=now() WHERE id=$2`,[r.sid,log.rows[0].id]);
    return {ok:true};
  } catch(e){await query(`UPDATE notifications_log SET status='failed' WHERE id=$1`,[log.rows[0].id]);throw e;}
}

export async function sendWhatsApp({ clinicId, appointmentId, phone, params, notificationType='transactional' }) {
  const log=await query(`INSERT INTO notifications_log (clinic_id,appointment_id,channel,recipient_phone,message,status,notification_type)
    VALUES ($1,$2,'whatsapp',$3,$4,'queued',$5) RETURNING id`,[clinicId,appointmentId,phone,JSON.stringify(params),notificationType]);
  if(!process.env.WHATSAPP_PHONE_NUMBER_ID||!process.env.WHATSAPP_ACCESS_TOKEN||!process.env.WHATSAPP_TEMPLATE_NAME){
    await query(`UPDATE notifications_log SET status='failed' WHERE id=$1`,[log.rows[0].id]);
    return {ok:false,skipped:true,reason:'WhatsApp provider not configured'};
  }
  try{
    const r=await axios.post(`https://graph.facebook.com/v20.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,{
      messaging_product:'whatsapp',to:toPhone(phone),type:'template',template:{name:process.env.WHATSAPP_TEMPLATE_NAME,language:{code:process.env.WHATSAPP_TEMPLATE_LANGUAGE||'en_US'},components:[{type:'body',parameters:params.map(p=>({type:'text',text:String(p)}))}]}
    },{headers:{Authorization:`Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`}});
    await query(`UPDATE notifications_log SET status='sent',provider_message_id=$1,sent_at=now() WHERE id=$2`,[r.data.messages?.[0]?.id||null,log.rows[0].id]);
    return {ok:true};
  }catch(e){await query(`UPDATE notifications_log SET status='failed' WHERE id=$1`,[log.rows[0].id]);throw e;}
}

export async function notifyBookingConfirmed({clinicId,appointmentId,phone,doctorName,date,time,planAllowsWhatsapp}){
  const smsMsg=`تم تأكيد حجزك عند ${doctorName} يوم ${date} الساعة ${time}. أوندوك`;
  await sendSMS({clinicId,appointmentId,phone,message:smsMsg});
  if(planAllowsWhatsapp) await sendWhatsApp({clinicId,appointmentId,phone,params:[doctorName,date,time]});
}

export async function processDueReminders(){
  const r=await query(`SELECT a.id,a.clinic_id,a.appointment_date,a.appointment_time,p.phone,d.name doctor_name,
    c.name clinic_name,COALESCE(sp.whatsapp_enabled,false) whatsapp_enabled
    FROM appointments a JOIN patients p ON p.id=a.patient_id JOIN doctors d ON d.id=a.doctor_id JOIN clinics c ON c.id=a.clinic_id
    LEFT JOIN subscriptions s ON s.clinic_id=c.id AND s.status IN ('active','trialing')
    LEFT JOIN subscription_plans sp ON sp.id=s.plan_id
    WHERE a.status='confirmed' AND (a.appointment_date::timestamp+a.appointment_time) BETWEEN now()+interval '1 hour 50 minutes' AND now()+interval '2 hours 10 minutes'
       OR a.status='confirmed' AND (a.appointment_date::timestamp+a.appointment_time) BETWEEN now()+interval '23 hours 50 minutes' AND now()+interval '24 hours 10 minutes'
    LIMIT 100`);
  let sent=0;
  for(const a of r.rows){
    const hours=((new Date(`${a.appointment_date}T${String(a.appointment_time).slice(0,8)}`)-new Date())/3600000);
    const type=hours<6?'reminder_2h':'reminder_24h';
    const exists=await query(`SELECT 1 FROM notifications_log WHERE appointment_id=$1 AND notification_type=$2 AND status='sent' LIMIT 1`,[a.id,type]);
    if(exists.rows.length) continue;
    const msg=`تذكير بموعدك عند ${a.doctor_name} يوم ${a.appointment_date} الساعة ${String(a.appointment_time).slice(0,5)}. أوندوك`;
    const result=await sendSMS({clinicId:a.clinic_id,appointmentId:a.id,phone:a.phone,message:msg,notificationType:type});
    if(result.ok) sent++;
    if(a.whatsapp_enabled) await sendWhatsApp({clinicId:a.clinic_id,appointmentId:a.id,phone:a.phone,params:[a.doctor_name,String(a.appointment_date),String(a.appointment_time).slice(0,5)],notificationType:type});
  }
  return sent;
}
