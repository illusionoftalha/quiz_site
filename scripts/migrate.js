'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { pool } = require('../lib/db');
(async () => {
  const migration = fs.readFileSync(path.join(__dirname, '../migrations/001_auth.sql'), 'utf8');
  const statements = migration.split(';').map(s => s.replace(/^--.*$/gm, '').trim()).filter(Boolean);
  for (const sql of statements) await pool.query(sql);
  console.log('Authentication migration applied successfully.');
})().catch(error => { console.error('Migration failed:', error.message); process.exitCode = 1; })
  .finally(() => pool.end());
