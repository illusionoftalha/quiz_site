'use strict';
const { pool } = require('../lib/db');
const { hashPassword } = require('../lib/auth');
const [role, identity] = process.argv.slice(2);
if (!['student', 'admin'].includes(role) || !identity || identity.length > 60) {
  console.error('Usage: node scripts/provision.js student ROLL_NO | admin USERNAME');
  process.exit(1);
}
if (!process.stdin.isTTY || !process.stdin.setRawMode) {
  console.error('Run in an interactive terminal; do not pass passwords in command arguments.');
  process.exit(1);
}
function readSecret(prompt) {
  return new Promise(resolve => {
    process.stdout.write(prompt);
    let value = '';
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    const handle = chunk => {
      for (const ch of chunk) {
        if (ch === '\u0003') process.exit(130);
        if (ch === '\r' || ch === '\n') {
          process.stdin.off('data', handle);
          process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdout.write('\n');
          resolve(value);
          return;
        }
        if (ch === '\u007f' || ch === '\b') value = value.slice(0, -1);
        else if (ch.charCodeAt(0) >= 32 && value.length < 256) value += ch;
      }
    };
    process.stdin.on('data', handle);
  });
}
(async () => {
  const password = await readSecret('New password (12+ chars; hidden): ');
  const confirm = await readSecret('Confirm password (hidden): ');
  if (password !== confirm) throw new Error('Passwords did not match');
  const hash = await hashPassword(password);
  if (role === 'student') {
    const [rows] = await pool.query('SELECT roll_no FROM students WHERE roll_no=?', [identity]);
    if (!rows.length) throw new Error('Student does not exist');
    await pool.query(
      'INSERT INTO student_credentials (roll_no,password_hash) VALUES (?,?) ON DUPLICATE KEY UPDATE password_hash=VALUES(password_hash)',
      [identity, hash]);
  } else {
    await pool.query(
      'INSERT INTO admin_users (username,password_hash) VALUES (?,?) ON DUPLICATE KEY UPDATE password_hash=VALUES(password_hash)',
      [identity, hash]);
  }
  await pool.query('UPDATE auth_sessions SET revoked_at=NOW() WHERE role=? AND subject=? AND revoked_at IS NULL',
    [role, identity]);
  console.log('Credentials provisioned; prior login sessions revoked.');
})().catch(error => { console.error('Provisioning failed:', error.message); process.exitCode = 1; })
  .finally(() => pool.end());
