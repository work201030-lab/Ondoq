import { query } from '../db.js';
export async function audit(req, action, entity=null, entityId=null, metadata={}) {
  try {
    await query(`INSERT INTO audit_logs (clinic_id,user_id,action,entity,entity_id,metadata,ip_address)
      VALUES ($1,$2,$3,$4,$5,$6,$7)`, [req.clinicId || null, req.userId || null, action, entity, entityId, metadata, req.ip || null]);
  } catch (e) { console.error('audit log failed', e.message); }
}
