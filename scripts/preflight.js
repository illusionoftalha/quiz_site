'use strict';
// Read-only release checks. Prints counts, never credentials or student records.
const {pool}=require('../lib/db');
(async()=>{
  const origin=new URL(process.env.APP_ORIGIN || '');
  if(origin.origin!==process.env.APP_ORIGIN)throw Error('APP_ORIGIN must be an origin without a path or trailing slash');
  if(process.env.NODE_ENV==='production' && origin.protocol!=='https:')throw Error('Production requires HTTPS APP_ORIGIN');
  const tables=['students','quiz_versions','quiz_sessions','mcq_questions','mcq_answers','coding_challenges','test_cases','code_submissions','auto_saves','security_logs','admin_users','student_credentials','auth_sessions','v_session_results','v_coding_leaderboard'];
  for(const table of tables)await pool.query('SELECT 1 FROM `'+table+'` LIMIT 0');
  const [admins]=await pool.query('SELECT password_hash FROM admin_users');
  const validHash=hash=>typeof hash==='string' && /^scrypt\$16384\$[0-9a-f]{32}\$[0-9a-f]{128}$/.test(hash);
  if(!admins.some(row=>validHash(row.password_hash)))throw Error('No provisioned administrator');
  const [[{missing}]]=await pool.query('SELECT COUNT(*) AS missing FROM students s LEFT JOIN student_credentials c ON c.roll_no=s.roll_no WHERE c.roll_no IS NULL');
  const [credentials]=await pool.query('SELECT password_hash FROM student_credentials');
  const invalid=credentials.filter(row=>!validHash(row.password_hash)).length;
  if(missing || invalid)throw Error(`Student credentials incomplete: ${missing} missing, ${invalid} invalid`);
  console.log('PASS: origin, database schema and account credential coverage. No data changed.');
  console.log('Still required: private backup, credential delivery, exposed-secret rotation and hosted exam smoke test.');
})().catch(error=>{
  // Database error messages can contain connection details; expose only known checks.
  console.error(error.code ? 'Preflight failed: database connection or schema check failed ('+error.code+')' : 'Preflight failed: '+error.message);
  process.exitCode=1;
}).finally(()=>pool.end());
