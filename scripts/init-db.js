'use strict';
const {pool} = require('../lib/db');
const {initializeSchema} = require('../lib/schema');

(async () => {
  if (!process.env.DB_NAME) throw Error('Set DB_NAME explicitly to an empty database');
  const [tables] = await pool.query('SHOW TABLES');
  if (tables.length) throw Error('Database is not empty. Use npm run migrate for an existing installation.');
  await initializeSchema(pool);
  console.log('Empty assessment schema created. Run npm run migrate, then provision accounts.');
})().catch(error => {
  console.error('Initialization failed:', error.message);
  process.exitCode = 1;
}).finally(() => pool.end());
