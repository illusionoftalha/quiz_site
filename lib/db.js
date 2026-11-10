'use strict';
const fs = require('node:fs');
const mysql = require('mysql2/promise');
const host = process.env.DB_HOST || 'localhost';
const remote = !['localhost', '127.0.0.1', '::1'].includes(host);
const sslEnabled = process.env.DB_SSL === 'true' || (remote && process.env.DB_SSL !== 'false');
if (remote && !sslEnabled && process.env.NODE_ENV === 'production') {
  throw new Error('Remote database TLS cannot be disabled in production');
}
const ssl = sslEnabled ? {
  rejectUnauthorized: true,
  ...(process.env.DB_SSL_CA ? { ca: fs.readFileSync(process.env.DB_SSL_CA, 'utf8') } : {})
} : undefined;
const pool = mysql.createPool({
  host, port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root', password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'quiz', ssl, waitForConnections: true,
  connectionLimit: 10, queueLimit: 50, multipleStatements: false
});
module.exports = { pool };
