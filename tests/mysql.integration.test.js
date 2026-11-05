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
  const origin = 'http://127.0.0.1:3000';
  process.env.APP_ORIGIN = origin;
  const pool = mysql.createPool({
    host: '127.0.0.1', port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root', password: process.env.DB_PASSWORD,
    database: 'quiz_ci', waitForConnections: true
  });
  let server, base, studentCookie, adminCookie, sessionId;
  const originalFetch = global.fetch;
  const headers = (cookie) => ({ 'Content-Type': 'application/json', Origin: origin, ...(cookie ? {Cookie: cookie} : {}) });
  async function call(route, { method = 'GET', cookie, body } = {}) {
    const res = await originalFetch(base + route, {method, headers: headers(cookie), ...(body === undefined ? {} : {body: JSON.stringify(body)})});
    const raw = await res.text();
    return {status: res.status, data: raw ? JSON.parse(raw) : {}, cookie: res.headers.get('set-cookie')};
  }
  async function setupDatabase() {
    const commands = [
      'CREATE TABLE students (roll_no VARCHAR(20) PRIMARY KEY,full_name VARCHAR(100) NOT NULL)',
      'CREATE TABLE admin_users (id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,username VARCHAR(60) UNIQUE NOT NULL,password_hash VARCHAR(255) NOT NULL)',
      'CREATE TABLE quiz_versions (id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,version_code VARCHAR(20) UNIQUE NOT NULL,roll_no VARCHAR(20) NOT NULL,total_questions INT NOT NULL)',
      "CREATE TABLE quiz_sessions (id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,session_token VARCHAR(64) NOT NULL UNIQUE,roll_no VARCHAR(20) NOT NULL,version_code VARCHAR(20) NOT NULL,started_at DATETIME DEFAULT CURRENT_TIMESTAMP,submitted_at DATETIME DEFAULT NULL,mcq_score INT DEFAULT NULL,total_mcq INT DEFAULT NULL,status ENUM('IN_PROGRESS','SUBMITTED','ABANDONED') NOT NULL DEFAULT 'IN_PROGRESS',time_remaining INT NOT NULL DEFAULT 3600)",
      'CREATE TABLE mcq_questions (id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,version_code VARCHAR(20) NOT NULL,q_number INT NOT NULL,topic VARCHAR(50),question_text TEXT,code_snippet TEXT,option_a TEXT,option_b TEXT,option_c TEXT,option_d TEXT,correct_option INT NOT NULL)',
      'CREATE TABLE mcq_answers (id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,session_id INT NOT NULL,question_id INT NOT NULL,selected_option INT NOT NULL,is_correct BOOLEAN NOT NULL,UNIQUE KEY uq_session_q (session_id,question_id))',
      'CREATE TABLE coding_challenges (challenge_code VARCHAR(20) NOT NULL PRIMARY KEY,version_code VARCHAR(20),title VARCHAR(200),description TEXT,constraints_txt TEXT,sample_input TEXT,sample_output TEXT)',
      'CREATE TABLE test_cases (id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,challenge_code VARCHAR(20),case_number INT NOT NULL,stdin_input TEXT,expected_output TEXT)',
      "CREATE TABLE code_submissions (id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,session_id INT NOT NULL,challenge_code VARCHAR(20) NOT NULL,submitted_code LONGTEXT NOT NULL,language VARCHAR(20) NOT NULL DEFAULT 'c',submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,verdict ENUM('PENDING','ACCEPTED','WRONG_ANSWER','COMPILE_ERROR','RUNTIME_ERROR','TIME_LIMIT') NOT NULL DEFAULT 'PENDING',cases_passed INT DEFAULT 0,total_cases INT DEFAULT 0,compiler_output TEXT)",
      'CREATE TABLE auto_saves (session_id INT NOT NULL,challenge_code VARCHAR(20) NOT NULL,saved_code LONGTEXT NOT NULL,PRIMARY KEY(session_id,challenge_code))',
      'CREATE TABLE security_logs (id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,session_id INT NOT NULL,event_type VARCHAR(50) NOT NULL,details TEXT,logged_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)',
      'CREATE VIEW v_session_results AS SELECT id AS session_id,roll_no,version_code,started_at,submitted_at,mcq_score,total_mcq,status FROM quiz_sessions',
      'CREATE VIEW v_coding_leaderboard AS SELECT qs.roll_no,cs.session_id,cs.challenge_code,cc.title,cs.verdict,cs.cases_passed,cs.total_cases,cs.submitted_at FROM code_submissions cs JOIN quiz_sessions qs ON qs.id=cs.session_id JOIN coding_challenges cc ON cc.challenge_code=cs.challenge_code'
    ];
    for (const sql of commands) await pool.query(sql);
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
  });
  after(async () => {
    global.fetch = originalFetch;
    if (server) await new Promise(resolve => server.close(resolve));
    await pool.end();
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
    const submitted = await call('/api/submit_code',{method:'POST',cookie:studentCookie,body:{session_id:sessionId,challenge_code:'CH1',code:'int main(){return 0;}' }});
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
  test('Student logout revokes the server-side session',async()=>{
    assert.equal((await call('/api/auth/logout',{method:'POST',cookie:studentCookie,body:{}})).status,200);
    assert.equal((await call('/api/auth/me',{cookie:studentCookie})).status,401);
  });
}
