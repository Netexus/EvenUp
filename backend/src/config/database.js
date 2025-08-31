const { Pool } = require('pg');
require('dotenv').config();

// Helper: convert MySQL-style '?' placeholders to Postgres-style $1..$n
function toPgParams(sql, params = []) {
  if (!params || params.length === 0) return { sql, params };
  let i = 0;
  const converted = sql.replace(/\?/g, () => `$${++i}`);
  return { sql: converted, params };
}

/**
 * PostgreSQL connection pool configuration
 * - Production (Render/hosted): use DATABASE_URL with SSL on
 * - Local development: use discrete env vars, SSL off by default
 */
const isProd = process.env.NODE_ENV === 'production' || !!process.env.RENDER;
const useDatabaseUrl = isProd && !!process.env.DATABASE_URL;
const defaultLocalSsl = false;
const defaultProdSsl = { rejectUnauthorized: false };

const pool = new Pool(
  useDatabaseUrl
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl:
          process.env.PGSSL === 'false'
            ? false
            : process.env.PGSSL === 'true'
            ? defaultProdSsl
            : defaultProdSsl
      }
    : {
        host: process.env.DB_HOST || '127.0.0.1',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'evenup',
        port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
        ssl:
          process.env.PGSSL === 'true'
            ? defaultProdSsl
            : process.env.PGSSL === 'false'
            ? false
            : defaultLocalSsl
      }
);

// mysql2-compatible query/execute wrappers
function classify(sql) {
  const m = String(sql).trim().toUpperCase();
  if (m.startsWith('INSERT')) return 'INSERT';
  if (m.startsWith('UPDATE')) return 'UPDATE';
  if (m.startsWith('DELETE')) return 'DELETE';
  return 'OTHER';
}

async function query(sql, params, cb) {
  try {
    let text = sql;
    let values = params;
    const kind = classify(sql);
    // Append RETURNING * for inserts if not present, to capture ids
    if (kind === 'INSERT' && !/returning\s+/i.test(sql)) {
      text = `${sql} RETURNING *`;
    }
    const converted = toPgParams(text, values);
    const result = await pool.query(converted.sql, converted.params);
    let out;
    if (kind === 'INSERT' || kind === 'UPDATE' || kind === 'DELETE') {
      // Emulate mysql2's result header
      const header = { insertId: undefined, affectedRows: result.rowCount, rowCount: result.rowCount };
      if (kind === 'INSERT' && result.rows && result.rows[0]) {
        const first = result.rows[0];
        const idKey = Object.keys(first).find(k => /_id$/.test(k));
        if (idKey) header.insertId = first[idKey];
      }
      out = header;
    } else {
      out = result.rows;
    }
    if (typeof cb === 'function') return cb(null, out);
    return [out, result];
  } catch (err) {
    if (typeof cb === 'function') return cb(err);
    throw err;
  }
}

async function execute(sql, params, cb) {
  return query(sql, params, cb);
}

// Provide a getConnection API for transaction usage similar to mysql2
async function getConnection() {
  const client = await pool.connect();
  return {
    async beginTransaction() { await client.query('BEGIN'); },
    async commit() { await client.query('COMMIT'); },
    async rollback() { await client.query('ROLLBACK'); },
    release() { client.release(); },
    async query(sql, params) {
      let text = sql;
      const kind = classify(sql);
      if (kind === 'INSERT' && !/returning\s+/i.test(sql)) text = `${sql} RETURNING *`;
      const { sql: converted, params: values } = toPgParams(text, params);
      const res = await client.query(converted, values);
      if (kind === 'INSERT' || kind === 'UPDATE' || kind === 'DELETE') {
        const header = { insertId: undefined, affectedRows: res.rowCount, rowCount: res.rowCount };
        if (kind === 'INSERT' && res.rows && res.rows[0]) {
          const idKey = Object.keys(res.rows[0]).find(k => /_id$/.test(k));
          if (idKey) header.insertId = res.rows[0][idKey];
        }
        return [header, res];
      }
      return [res.rows, res];
    },
    async execute(sql, params) { return this.query(sql, params); }
  };
}

// Test the connection
async function testConnection() {
  try {
    await pool.query('SELECT 1');
    console.log('Connected to PostgreSQL');
    return true;
  } catch (error) {
    console.error('Error connecting to PostgreSQL:', error.message);
    return false;
  }
}

// Test connection on startup (skip during tests)
if (process.env.NODE_ENV !== 'test') {
  testConnection();
}

module.exports = { pool, query, execute, getConnection };
