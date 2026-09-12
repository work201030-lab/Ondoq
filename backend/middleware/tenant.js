import jwt from 'jsonwebtoken';

export function requireClinic(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'غير مصرح' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (!payload.clinicId || !payload.userId) return res.status(401).json({ error: 'توكن غير صالح' });
    req.clinicId = payload.clinicId;
    req.userId = payload.userId;
    req.role = payload.role;
    next();
  } catch {
    return res.status(401).json({ error: 'توكن غير صالح أو منتهي' });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => roles.includes(req.role)
    ? next()
    : res.status(403).json({ error: 'ليس لديك صلاحية لهذا الإجراء' });
}
