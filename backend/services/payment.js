import crypto from 'crypto';
import axios from 'axios';

const PAYMOB_BASE_URL = process.env.PAYMOB_BASE_URL || 'https://accept.paymob.com';

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function splitName(name = 'Customer') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || 'Customer',
    lastName: parts.slice(1).join(' ') || 'Customer',
  };
}

export async function createPaymobPayment({ amountEGP, patientName, patientPhone, merchantOrderId, email, description = 'ONDOQ payment' }) {
  const amountCents = Math.round(Number(amountEGP) * 100);
  if (!Number.isInteger(amountCents) || amountCents <= 0) throw new Error('Invalid payment amount');

  const secretKey = requiredEnv('PAYMOB_SECRET_KEY');
  const publicKey = requiredEnv('PAYMOB_PUBLIC_KEY');
  requiredEnv('PAYMOB_HMAC_SECRET');
  const integrationId = Number(requiredEnv('PAYMOB_INTEGRATION_ID_CARD'));
  if (!Number.isInteger(integrationId)) throw new Error('PAYMOB_INTEGRATION_ID_CARD must be an integer');
  if (!patientPhone) throw new Error('Paymob requires a phone number');

  const { firstName, lastName } = splitName(patientName);
  const reference = String(merchantOrderId);
  const appUrl = String(requiredEnv('APP_URL')).replace(/\/$/, '');

  const payload = {
    amount: amountCents,
    currency: 'EGP',
    payment_methods: [integrationId],
    items: [{
      name: description.slice(0, 50),
      amount: amountCents,
      description: description.slice(0, 255),
      quantity: 1,
    }],
    billing_data: {
      first_name: firstName,
      last_name: lastName,
      email: email || process.env.PAYMOB_DEFAULT_EMAIL || 'no-reply@ondoq.app',
      phone_number: patientPhone,
      apartment: 'NA', floor: 'NA', street: 'NA', building: 'NA',
      shipping_method: 'NA', postal_code: 'NA', city: 'Cairo', country: 'EG', state: 'NA',
    },
    customer: {
      first_name: firstName,
      last_name: lastName,
      email: email || process.env.PAYMOB_DEFAULT_EMAIL || 'no-reply@ondoq.app',
    },
    special_reference: reference,
    notification_url: `${appUrl}/webhooks/paymob`,
    redirection_url: `${appUrl}/payment/complete`,
    expiration: 3600,
  };

  const { data } = await axios.post(`${PAYMOB_BASE_URL}/v1/intention/`, payload, {
    headers: {
      Authorization: `Token ${secretKey}`,
      'Content-Type': 'application/json',
    },
    timeout: 15000,
  });

  if (!data?.client_secret) throw new Error('Paymob did not return client_secret');

  return {
    paymentUrl: `${PAYMOB_BASE_URL}/unifiedcheckout/?publicKey=${encodeURIComponent(publicKey)}&clientSecret=${encodeURIComponent(data.client_secret)}`,
    orderId: data.intention_order_id || data.payment_keys?.[0]?.order_id || null,
    intentionId: data.id || null,
    reference,
  };
}

export function verifyPaymobHmac(data, receivedHmac) {
  if (!receivedHmac || !process.env.PAYMOB_HMAC_SECRET || !data) return false;
  const orderedString = [
    data.amount_cents, data.created_at, data.currency, data.error_occured,
    data.has_parent_transaction, data.id, data.integration_id, data.is_3d_secure,
    data.is_auth, data.is_capture, data.is_refunded, data.is_standalone_payment,
    data.is_voided, data.order?.id, data.owner, data.pending, data.source_data?.pan,
    data.source_data?.sub_type, data.source_data?.type, data.success,
  ].join('');
  const calculated = crypto.createHmac('sha512', process.env.PAYMOB_HMAC_SECRET).update(orderedString).digest('hex');
  const a = Buffer.from(calculated, 'utf8');
  const b = Buffer.from(String(receivedHmac), 'utf8');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
