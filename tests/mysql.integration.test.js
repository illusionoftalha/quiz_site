'use strict';
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const mysql = require('mysql2/promise');
const { hashPassword } = require('../lib/auth');

// SAFETY: never create/replace tables in a real user database.
if (process.env.RUN_MYSQL_TESTS !== '1') {
  test('MySQL end-to-end flow (enable only with RUN_MYSQL_TESTS=1)', { skip: true }, () => {});
} else {
  if (process.env.NODE_ENV !== 'test' || process.env.DB_NAME !== 'quiz_ci' || process.env.DB_HOST !== '127.0.0.1') {
    throw new Error('Refusing to run integration tests outside isolated quiz_ci MySQL');
  }
  const origin = () => process.env.APP_ORIGIN;
  process.env.APP_ORIGIN = 'http://127.0.0.1:3000';
  const pool = mysql.createPool({
    host: '127.0.0.1', port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root', password: process.env.DB_PASSWORD,
    database: 'quiz_ci', waitForConnections: true
  });
  let server, base, studentCookie, adminCookie, sessionId;
  const originalFetch = global.fetch;
  const headers = (cookie) => ({ 'Content-Type': 'application/json', Origin: origin(), ...(cookie ? {Cookie: cookie} : {}) });
  async function call(route, { method = 'GET', cookie, body } = {}) {
    const res = await originalFetch(base + route, {method, headers: headers(cookie), ...(body === undefined ? {} : {body: JSON.stringify(body)})});
    const raw = await res.text();
    return {status: res.status, data: raw ? JSON.parse(raw) : {}, cookie: res.headers.get('set-cookie')};
  }
  async function setupDatabase() {
    await require('../lib/schema').initializeSchema(pool);
    const { execFileSync } = require('node:child_process');
    const path = require('node:path');
    execFileSync(process.execPath, [path.join(__dirname, '../scripts/migrate.js')], {
      env: process.env, stdio: 'pipe', timeout: 15000
    });
    await pool.query('INSERT INTO students(roll_no,full_name) VALUES (?,?),(?,?)',['S1','Test Student','S2','Other Student']);
    await pool.query('INSERT INTO quiz_versions(version_code,roll_no,total_questions) VALUES (?,?,?)',['V1','S1',2]);
    await pool.query('INSERT INTO mcq_questions(version_code,q_number,topic,question_text,option_a,option_b,option_c,option_d,correct_option) VALUES (?,?,?,?,?,?,?,?,?),(?,?,?,?,?,?,?,?,?)',
      ['V1',1,'C','Question 1','A','B','C','D',0,'V1',2,'C','Question 2','A','B','C','D',3]);
    await pool.query('INSERT INTO coding_challenges(challenge_code,version_code,title,description,sample_input,sample_output) VALUES (?,?,?,?,?,?)',
      ['CH1','V1','Sample program','Return OK','','OK']);
    await pool.query('INSERT INTO test_cases(challenge_code,case_number,stdin_input,expected_output) VALUES (?,?,?,?)',
      ['CH1',1,'','OK']);
    const hash = await hashPassword('ExampleOnlyPassword123!');
    await pool.query('INSERT INTO student_credentials(roll_no,password_hash) VALUES (?,?),(?,?)',['S1',hash,'S2',hash]);
    await pool.query('INSERT INTO admin_users(username,password_hash) VALUES (?,?)',['proctor',hash]);
  }
  before(async () => {
    await setupDatabase();
    const { once } = require('node:events');
    global.fetch = async (url, options) => {
      if (String(url).startsWith('https://emacs.piston.rs/')) {
        return { ok: true, json: async () => ({ run: {code:0,stdout:'OK\n'} }) };
      }
      return originalFetch(url,options);
    };
    const app = require('../server');
    server = app.listen(0,'127.0.0.1');
    await once(server,'listening');
    base = 'http://127.0.0.1:' + server.address().port;
    process.env.APP_ORIGIN = base;
  });
  after(async () => {
    global.fetch = originalFetch;
    if (server) await new Promise(resolve => server.close(resolve));
    await pool.end();
    await require('../lib/db').pool.end();
  });

  test('Unauthenticated access to proctor data is rejected',async()=>{
    assert.equal((await call('/api/admin/submissions')).status,401);
    assert.equal((await call('/api/student/results/S1')).status,401);
  });
  test('Student password login; wrong passwords fail; admin credentials are distinct',async()=>{
    assert.equal((await call('/api/student/login',{method:'POST',body:{roll_no:'S1',password:'wrong'}})).status,401);
    const ok = await call('/api/student/login',{method:'POST',body:{roll_no:'S1',password:'ExampleOnlyPassword123!'}});
    assert.equal(ok.status,200);
    assert.equal(ok.data.student.roll_no,'S1');
    studentCookie = ok.cookie.split(';')[0];
    const admin = await call('/api/admin/login',{method:'POST',body:{username:'proctor',password:'ExampleOnlyPassword123!'}});
    assert.equal(admin.status,200);
    adminCookie = admin.cookie.split(';')[0];
    assert.equal((await call('/api/admin/submissions',{cookie:studentCookie})).status,403);
  });
  test('Cross-account reads and unauthorized assessment assignments are blocked',async()=>{
    assert.equal((await call('/api/student/results/S2',{cookie:studentCookie})).status,403);
    assert.equal((await call('/api/start_assessment',{method:'POST',cookie:studentCookie,body:{version_code:'NOT_ASSIGNED'}})).status,403);
  });
  test('Student begins assessment, reads MCQs and timer does not mutate database',async()=>{
    const start = await call('/api/start_assessment',{method:'POST',cookie:studentCookie,body:{version_code:'V1'}});
    assert.equal(start.status,200);
    assert.equal(start.data.success,true);
    sessionId = start.data.session_id;
    assert.equal(start.data.session_token,undefined);
    const secondStart = await call('/api/start_assessment',{method:'POST',cookie:studentCookie,body:{version_code:'V1'}});
    assert.equal(secondStart.status,200);
    assert.equal(secondStart.data.session_id,sessionId,'restarting must reuse the same active session');
    const concurrent = await Promise.all(Array.from({length:4},()=>call('/api/start_assessment',{method:'POST',cookie:studentCookie,body:{version_code:'V1'}})));
    assert.ok(concurrent.every(result=>result.status===200 && result.data.session_id===sessionId));
    const questions = await call('/api/mcq/V1',{cookie:studentCookie});
    assert.equal(questions.status,200);
    assert.equal(questions.data.questions.length,2);
    const beforeTimer = await pool.query('SELECT time_remaining FROM quiz_sessions WHERE id=?',[sessionId]);
    const timer = await call('/api/timer_sync/'+sessionId,{cookie:studentCookie});
    assert.equal(timer.status,200);
    assert.ok(timer.data.time_remaining <= 3600 && timer.data.time_remaining > 0);
    const afterTimer = await pool.query('SELECT time_remaining FROM quiz_sessions WHERE id=?',[sessionId]);
    assert.equal(afterTimer[0][0].time_remaining,beforeTimer[0][0].time_remaining);
  });
  test('MCQs are scored exactly once; student can then access coding',async()=>{
    const [questions] = await pool.query('SELECT id FROM mcq_questions ORDER BY q_number');
    const answers = [{q_id:questions[0].id,selected_opt:0},{q_id:questions[1].id,selected_opt:2}];
    const first = await call('/api/submit_mcq',{method:'POST',cookie:studentCookie,body:{session_id:sessionId,answers,total_mcq:999}});
    assert.equal(first.status,200);
    assert.equal(first.data.score,1);
    assert.equal(first.data.total,2);
    const second = await call('/api/submit_mcq',{method:'POST',cookie:studentCookie,body:{session_id:sessionId,answers}});
    assert.equal(second.status,409);
    assert.equal((await call('/api/coding/V1',{cookie:studentCookie})).status,200);
  });
  test('Coding samples and hidden tests use external judge mock; finish and results work',async()=>{
    const run = await call('/api/run_code',{method:'POST',cookie:studentCookie,body:{challenge_code:'CH1',code:'int main(){return 0;}' }});
    assert.equal(run.status,200);
    const attempts = await Promise.all(Array.from({length:2},()=>call('/api/submit_code',{method:'POST',cookie:studentCookie,body:{session_id:sessionId,challenge_code:'CH1',code:'int main(){return 0;}' }})));
    assert.deepEqual(attempts.map(result=>result.status).sort(),[200,409]);
    const submitted = attempts.find(result=>result.status===200);
    assert.equal(submitted.status,200);
    assert.equal(submitted.data.verdict,'ACCEPTED');
    assert.equal((await call('/api/submit_code',{method:'POST',cookie:studentCookie,body:{session_id:sessionId,challenge_code:'CH1',code:'foo' }})).status,409);
    assert.equal((await call('/api/log_violation',{method:'POST',cookie:studentCookie,body:{session_id:sessionId,event_type:'TAB_SWITCH',details:'Test only'}})).status,200);
    const done = await call('/api/finish_assessment',{method:'POST',cookie:studentCookie,body:{session_id:sessionId}});
    assert.equal(done.status,200);
    const results=await call('/api/student/results/S1',{cookie:studentCookie});
    assert.equal(results.status,200);
    assert.equal(results.data.published,true);
    const proctor=await call('/api/admin/submissions',{cookie:adminCookie});
    assert.equal(proctor.status,200);
    assert.equal(proctor.data.submissions.length,1);
    assert.equal((await call('/api/admin/violations',{cookie:adminCookie})).status,200);
    assert.equal((await call('/api/autosave',{method:'POST',cookie:studentCookie,body:{session_id:sessionId,challenge_code:'CH1',saved_code:'new draft'}})).status,409);
  });
  test('Read-only preflight passes provisioned test schema and initialization refuses existing tables',()=>{
    const {execFileSync,spawnSync}=require('node:child_process');
    const path=require('node:path');
    assert.match(execFileSync(process.execPath,[path.join(__dirname,'../scripts/preflight.js')],{env:process.env,encoding:'utf8'}),/PASS:/);
    const init=spawnSync(process.execPath,[path.join(__dirname,'../scripts/init-db.js')],{env:process.env,encoding:'utf8'});
    assert.equal(init.status,1);
    assert.match(init.stderr,/not empty/);
  });
  test('Student logout revokes the server-side session',async()=>{
    assert.equal((await call('/api/auth/logout',{method:'POST',cookie:studentCookie,body:{}})).status,200);
    assert.equal((await call('/api/auth/me',{cookie:studentCookie})).status,401);
  });
}
