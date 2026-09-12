import { Router } from 'express';
import { query } from '../db.js';
import { requireClinic, requireRole } from '../middleware/tenant.js';

const router = Router();

const asCoordinate = (value, min, max) => {
  const n = Number(value);
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
};

// Google Maps URLs are generated without exposing an API key.

// Public clinic discovery: returns nearest clinics with a saved location.
router.get('/nearby', async (req, res) => {
  const lat = asCoordinate(req.query.lat, -90, 90);
  const lng = asCoordinate(req.query.lng, -180, 180);
  const radiusKm = Math.min(Math.max(Number(req.query.radiusKm) || 25, 1), 100);
  const specialty = String(req.query.specialty || '').trim().slice(0, 80);
  const openNow = String(req.query.openNow || '') === 'true';
  if (lat === null || lng === null) return res.status(400).json({ error: 'إحداثيات الموقع غير صحيحة' });

  try {
    const result = await query(`
      SELECT * FROM (
        SELECT id, name, slug, phone, email, city, address, latitude, longitude, maps_place_id, logo_url,
          6371 * acos(LEAST(1, GREATEST(-1,
            cos(radians($1)) * cos(radians(latitude)) * cos(radians(longitude) - radians($2)) +
            sin(radians($1)) * sin(radians(latitude))
          ))) AS distance_km,
          EXISTS (SELECT 1 FROM doctors d WHERE d.clinic_id=clinics.id AND d.active=true) AS has_active_doctors,
          EXISTS (SELECT 1 FROM doctors d WHERE d.clinic_id=clinics.id AND d.active=true
            AND extract(dow from CURRENT_DATE)::int = ANY(d.work_days)
            AND CURRENT_TIME >= make_time(d.start_hour,0,0) AND CURRENT_TIME < make_time(d.end_hour,0,0)
          ) AS open_now,
          (SELECT COALESCE(round(avg(rv.rating)::numeric,1),0) FROM reviews rv WHERE rv.clinic_id=clinics.id) AS rating,
          (SELECT count(*)::int FROM reviews rv WHERE rv.clinic_id=clinics.id) AS review_count,
          COALESCE((SELECT json_agg(json_build_object('id',ci.id,'url',ci.image_url,'caption',ci.caption) ORDER BY ci.sort_order,ci.created_at) FROM clinic_images ci WHERE ci.clinic_id=clinics.id),'[]'::json) AS images,
          COALESCE((SELECT json_agg(DISTINCT d.specialty ORDER BY d.specialty) FROM doctors d
            WHERE d.clinic_id=clinics.id AND d.active=true AND d.specialty IS NOT NULL AND trim(d.specialty) <> ''), '[]'::json) AS specialties
        FROM clinics
        WHERE status IN ('trial','active')
          AND latitude IS NOT NULL AND longitude IS NOT NULL
          AND ($4 = '' OR EXISTS (SELECT 1 FROM doctors sd WHERE sd.clinic_id=clinics.id AND sd.active=true AND sd.specialty ILIKE $4))
          AND ($5 = false OR EXISTS (SELECT 1 FROM doctors od WHERE od.clinic_id=clinics.id AND od.active=true
            AND extract(dow from CURRENT_DATE)::int = ANY(od.work_days)
            AND CURRENT_TIME >= make_time(od.start_hour,0,0) AND CURRENT_TIME < make_time(od.end_hour,0,0)))
      ) nearby
      WHERE distance_km <= $3
      ORDER BY distance_km ASC
      LIMIT 20
    `, [lat, lng, radiusKm, specialty, openNow]);

    const clinics = result.rows.map(c => ({
      ...c,
      distance_km: Number(Number(c.distance_km).toFixed(2)),
      google_maps_url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${c.latitude},${c.longitude}`)}${c.maps_place_id ? `&query_place_id=${encodeURIComponent(c.maps_place_id)}` : ''}`,
      directions_url: `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(`${lat},${lng}`)}&destination=${encodeURIComponent(`${c.latitude},${c.longitude}`)}`
    }));
    res.json({ clinics, center: { lat, lng }, radius_km: radiusKm });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'تعذر البحث عن العيادات القريبة' });
  }
});

router.get('/:clinicId/doctors', async (req, res) => {
  try {
    const r = await query(`SELECT id,name,specialty,bio,photo_url,price_egp,work_days,start_hour,end_hour,slot_minutes
      FROM doctors WHERE clinic_id=$1 AND active=true ORDER BY name ASC`, [req.params.clinicId]);
    res.json({ doctors: r.rows });
  } catch (e) { console.error(e); res.status(500).json({ error: 'تعذر تحميل أطباء العيادة' }); }
});

router.get('/:clinicId/available', async (req, res) => {
  const { doctorId, date } = req.query;
  if (!doctorId || !/^\d{4}-\d{2}-\d{2}$/.test(String(date || ''))) return res.status(400).json({ error: 'الطبيب والتاريخ مطلوبان' });
  try {
    const doctor = await query(`SELECT start_hour,end_hour,slot_minutes,work_days FROM doctors
      WHERE id=$1 AND clinic_id=$2 AND active=true`, [doctorId, req.params.clinicId]);
    if (!doctor.rows.length) return res.status(404).json({ error: 'الطبيب غير موجود أو غير متاح' });
    const d = doctor.rows[0];
    const weekday = new Date(`${date}T12:00:00`).getDay();
    if (!Array.isArray(d.work_days) || !d.work_days.includes(weekday)) return res.json({ slots: [] });
    const booked = await query(`SELECT appointment_time FROM appointments WHERE doctor_id=$1 AND appointment_date=$2 AND status <> 'cancelled'`, [doctorId, date]);
    const bookedSet = new Set(booked.rows.map(r => String(r.appointment_time).slice(0,5)));
    const slots=[];
    for(let h=d.start_hour; h<d.end_hour; h++) for(let m=0;m<60;m+=d.slot_minutes){
      const t=`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
      if(!bookedSet.has(t)) slots.push(t);
    }
    res.json({ slots });
  } catch(e) { console.error(e); res.status(500).json({ error: 'تعذر تحميل المواعيد المتاحة' }); }
});

router.get('/mine', requireClinic, async (req, res) => {
  try {
    const r = await query(`SELECT c.id,c.name,c.slug,c.phone,c.email,c.city,c.address,c.latitude,c.longitude,c.maps_place_id,c.logo_url,c.status, COALESCE((SELECT json_agg(json_build_object('id',ci.id,'url',ci.image_url,'caption',ci.caption) ORDER BY ci.sort_order,ci.created_at) FROM clinic_images ci WHERE ci.clinic_id=c.id),'[]'::json) AS images FROM clinics c WHERE c.id=$1`, [req.clinicId]);
    if (!r.rows.length) return res.status(404).json({ error: 'العيادة غير موجودة' });
    res.json(r.rows[0]);
  } catch (e) { console.error(e); res.status(500).json({ error: 'تعذر تحميل بيانات العيادة' }); }
});

router.patch('/location', requireClinic, requireRole('owner'), async (req, res) => {
  const lat = asCoordinate(req.body?.latitude, -90, 90);
  const lng = asCoordinate(req.body?.longitude, -180, 180);
  if (lat === null || lng === null) return res.status(400).json({ error: 'إحداثيات الموقع غير صحيحة' });
  const address = req.body?.address ? String(req.body.address).trim().slice(0, 500) : null;
  const mapsPlaceId = req.body?.mapsPlaceId ? String(req.body.mapsPlaceId).trim().slice(0, 255) : null;
  try {
    const r = await query(`UPDATE clinics SET latitude=$1,longitude=$2,address=COALESCE($3,address),maps_place_id=$4 WHERE id=$5 RETURNING id,name,address,latitude,longitude,maps_place_id`, [lat,lng,address,mapsPlaceId,req.clinicId]);
    res.json(r.rows[0]);
  } catch (e) { console.error(e); res.status(500).json({ error: 'تعذر حفظ موقع العيادة' }); }
});

router.delete('/location', requireClinic, requireRole('owner'), async (req, res) => {
  try {
    await query('UPDATE clinics SET latitude=NULL,longitude=NULL,maps_place_id=NULL WHERE id=$1', [req.clinicId]);
    res.json({ ok: true });
  } catch (e) { console.error(e); res.status(500).json({ error: 'تعذر حذف موقع العيادة' }); }
});

export default router;
