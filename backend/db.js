import pg from 'pg';
import { config } from './config.js';
const { Pool } = pg;

const connectionString = config.databaseUrl;
if (!connectionString) throw new Error('DATABASE_URL is required');

// Supabase PostgreSQL requires TLS on hosted connections. Keep this configurable
// so local PostgreSQL can still be used during development.
const sslEnabled = config.pgssl === 'true' || /supabase\.co/.test(connectionString);

export const pool = new Pool({
  connectionString,
  ssl: sslEnabled ? { rejectUnauthorized: false } : undefined,
  max: Number(process.env.DB_POOL_MAX || 10),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: Number(process.env.DB_CONNECTION_TIMEOUT_MS || 10000),
});

export const query = (text, params) => pool.query(text, params);
