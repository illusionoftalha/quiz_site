const express = require('express');
const {pool} = require('./lib/db');
const auth = require('./lib/auth');
const {gradeAnswers} = require('./lib/grading');
const {runWithPiston} = require('./lib/judge');
const { getSubmissions } = require('./lib/submissions');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.disable('x-powered-by');
app.use((req,res,next)=>{
 res.set('X-Content-Type-Options','nosniff');
 res.set('X-Frame-Options','DENY');
 res.set('Referrer-Policy','strict-origin-when-cross-origin');
 res.set('Content-Security-Policy',"frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'");
 if(req.path.startsWith('/api/'))res.set('Cache-Control','no-store');
 if((process.env.APP_ORIGIN||'').startsWith('https://'))res.set('Strict-Transport-Security','max-age=31536000');
 next();
});
app.use(express.json({limit:'100kb'}));
app.use(express.static(path.join(__dirname, 'public')));

const studentOnly=auth.requireRole(pool,'student'), adminOnly=auth.requireRole(pool,'admin');
const anyAuth=auth.requireRole(pool);
const asyncRoute=fn=>(req,res,next)=>Promise.resolve(fn(req,res,next)).catch(next);
const ownRoll=(req,res,next)=> req.params.roll_no===req.principal.subject?next():res.status(403).json({error:'Forbidden'});
const ownSession=asyncRoute(async(req,res,next)=>{
 const sid=Number(req.body?.session_id||req.params.session_id);
 if(!Number.isSafeInteger(sid)||sid<=0)return res.status(400).json({error:'Invalid session'});
 const [rows]=await pool.query('SELECT id,roll_no,version_code,status,started_at,mcq_score FROM quiz_sessions WHERE id=?',[sid]);
 if(!rows.length)return res.status(404).json({error:'Unknown session'});
 if(rows[0].roll_no!==req.principal.subject)return res.status(403).json({error:'Forbidden'});
 req.quizSession=rows[0];next();
});
const active=(req,res,next)=>req.quizSession.status==='IN_PROGRESS'&&Date.now()-new Date(req.quizSession.started_at).getTime()<3600000
 ? next():res.status(409).json({error:'Assessment finished or expired'});
app.use('/api',auth.sameOrigin);
app.post('/api/admin/login',asyncRoute(async(req,res)=>{
 const {username,password}=req.body||{};
 if(typeof username!=='string'||!/^[a-zA-Z0-9_.-]{1,60}$/.test(username)||typeof password!=='string'||password.length>256)return res.status(400).json({error:'Invalid credentials'});
 if(auth.loginLimited(req,'admin:'+username))return res.status(429).json({error:'Too many attempts'});
 const [rows]=await pool.query('SELECT password_hash FROM admin_users WHERE username=?',[username]);
 if(!rows.length||!await auth.verifyPassword(password,rows[0].password_hash)){
  auth.loginFailed(req,'admin:'+username);return res.status(401).json({error:'Invalid credentials'});
 }
 auth.loginSucceeded(req,'admin:'+username);
 const token=await auth.createSession(pool,'admin',username);
 res.set('Set-Cookie',auth.authCookie(token,process.env.APP_ORIGIN));
 res.json({success:true});
}));
app.get('/api/auth/me',anyAuth,asyncRoute(async(req,res)=>{
 if(req.principal.role==='admin')return res.json({role:'admin'});
 const [students]=await pool.query('SELECT roll_no,full_name FROM students WHERE roll_no=?',[req.principal.subject]);
 if(!students.length)return res.status(401).json({error:'Account unavailable'});
 const [versions]=await pool.query('SELECT version_code FROM quiz_versions WHERE roll_no=? ORDER BY id LIMIT 1',[req.principal.subject]);
 res.json({role:'student',student:{...students[0],version_code:versions[0]?.version_code||null}});
}));
app.post('/api/auth/logout',anyAuth,asyncRoute(async(req,res)=>{
 await pool.query('UPDATE auth_sessions SET revoked_at=NOW() WHERE token_hash=?',[req.authTokenHash]);
 res.set('Set-Cookie',auth.clearAuthCookie(process.env.APP_ORIGIN));
 res.json({success:true});
}));
// 1. Student Login
app.post('/api/student/login',asyncRoute(async(req,res)=>{
 const {roll_no,password}=req.body||{};
 if(typeof roll_no!=='string'||!/^[A-Za-z0-9_-]{1,20}$/.test(roll_no)||typeof password!=='string'||password.length>256)return res.status(400).json({error:'Invalid credentials'});
 if(auth.loginLimited(req,roll_no))return res.status(429).json({error:'Too many attempts'});
 const [rows]=await pool.query('SELECT s.roll_no,s.full_name,c.password_hash FROM students s JOIN student_credentials c ON c.roll_no=s.roll_no WHERE s.roll_no=?',[roll_no]);
 if(!rows.length||!await auth.verifyPassword(password,rows[0].password_hash)){
  auth.loginFailed(req,roll_no);return res.status(401).json({error:'Invalid credentials'});
 }
 auth.loginSucceeded(req,roll_no);
 const token=await auth.createSession(pool,'student',roll_no);
 res.set('Set-Cookie',auth.authCookie(token,process.env.APP_ORIGIN));
 const [versions]=await pool.query('SELECT version_code FROM quiz_versions WHERE roll_no=? ORDER BY id LIMIT 1',[roll_no]);
 res.json({success:true,student:{roll_no,full_name:rows[0].full_name,version_code:versions[0]?.version_code||null}});
}));
// 2. Fetch Assigned Assessments
// 2. Fetch Assigned Assessments
app.get('/api/student/assessments/:roll_no', studentOnly,ownRoll, async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT qv.version_code, qv.total_questions, MAX(qs.mcq_score) as mcq_score,
                   (SELECT status FROM quiz_sessions WHERE version_code = qv.version_code AND roll_no = ? ORDER BY id DESC LIMIT 1) as session_status
            FROM quiz_versions qv
            LEFT JOIN quiz_sessions qs ON qv.version_code = qs.version_code AND qs.roll_no = qv.roll_no
            WHERE qv.roll_no = ?
            GROUP BY qv.version_code, qv.total_questions
        `, [req.params.roll_no, req.params.roll_no]);
        res.json({ assessments: rows });
    } catch (e) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Fetch Student Results (Only if Completed)
app.get('/api/student/results/:roll_no', studentOnly,ownRoll, async (req, res) => {
    try {
        const { roll_no } = req.params;
        
        const [sessions] = await pool.query("SELECT * FROM v_session_results WHERE roll_no = ? AND status = 'SUBMITTED' ORDER BY started_at DESC", [roll_no]);
        
        if (sessions.length === 0) {
            return res.json({ published: false }); // Reusing published: false to indicate locked/incomplete
        }
        
        const [coding] = await pool.query("SELECT c.* FROM v_coding_leaderboard c JOIN quiz_sessions qs ON c.session_id = qs.id WHERE c.roll_no = ? AND qs.status = 'SUBMITTED' ORDER BY c.submitted_at DESC", [roll_no]);
        
        res.json({ published: true, sessions, coding });
    } catch (e) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Start exactly one assigned session per student/version, serialized on the assignment row.
app.post('/api/start_assessment',studentOnly,asyncRoute(async(req,res)=>{
 const {version_code}=req.body||{};
 const roll_no=req.principal.subject;
 if(typeof version_code!=='string'|| !/^[A-Za-z0-9_-]{1,20}$/.test(version_code))
  return res.status(400).json({error:'Invalid assessment'});
 const conn=await pool.getConnection();
 let session_id,mcq_submitted=false;
 try{
  await conn.beginTransaction();
  const [assigned]=await conn.query('SELECT version_code FROM quiz_versions WHERE roll_no=? AND version_code=? FOR UPDATE',[roll_no,version_code]);
  if(!assigned.length){await conn.rollback();return res.status(403).json({error:'Assessment not assigned'});}
  const [previous]=await conn.query('SELECT id,status,started_at,mcq_score FROM quiz_sessions WHERE roll_no=? AND version_code=? ORDER BY id DESC LIMIT 1',[roll_no,version_code]);
  if(previous.length){
   const recent=previous[0];
   if(recent.status!=='IN_PROGRESS'||Date.now()-new Date(recent.started_at).getTime()>=3600000){
    await conn.rollback();return res.status(409).json({error:'Assessment submitted or expired'});
   }
   session_id=recent.id;
   mcq_submitted=recent.mcq_score!==null;
  }else{
   const token=require('node:crypto').randomBytes(32).toString('hex');
   const [created]=await conn.query('INSERT INTO quiz_sessions(session_token,roll_no,version_code) VALUES(?,?,?)',
     [token,roll_no,version_code]);
   session_id=created.insertId;
  }
  await conn.commit();
 }catch(error){await conn.rollback();throw error;}finally{conn.release();}
 const [submissions]=await pool.query('SELECT DISTINCT challenge_code FROM code_submissions WHERE session_id=?',[session_id]);
 res.json({success:true,session_id,mcq_submitted,coding_submissions:submissions.map(row=>row.challenge_code)});
}));

// 2. Fetch MCQ Questions
app.get('/api/mcq/:version_code', studentOnly, async (req, res) => {
    try {
        const [assigned]=await pool.query("SELECT 1 FROM quiz_sessions WHERE roll_no=? AND version_code=? AND status='IN_PROGRESS' AND started_at>DATE_SUB(NOW(),INTERVAL 1 HOUR) LIMIT 1",[req.principal.subject,req.params.version_code]);
        if(!assigned.length)return res.status(403).json({error:'Assessment not started'});
        const { version_code } = req.params;
        const [questions] = await pool.query('SELECT id, q_number, topic, question_text, code_snippet, option_a as opt_a, option_b as opt_b, option_c as opt_c, option_d as opt_d FROM mcq_questions WHERE version_code = ? ORDER BY q_number', [version_code]);
        res.json({ questions });
    } catch (e) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 3. Submit MCQ Answers
app.post('/api/submit_mcq', studentOnly,ownSession,active, async (req, res) => {
    try {
        const { session_id, answers } = req.body;
        
        if(req.quizSession.mcq_score!==null)return res.status(409).json({error:'Already submitted'});
        const [questions]=await pool.query('SELECT id,correct_option FROM mcq_questions WHERE version_code=?',[req.quizSession.version_code]);
        let grading;
        try{grading=gradeAnswers(questions,answers);}catch(error){return res.status(400).json({error:error.message});}
        const conn=await pool.getConnection();
        try{
         await conn.beginTransaction();
         const [changed]=await conn.query("UPDATE quiz_sessions SET mcq_score=?,total_mcq=? WHERE id=? AND roll_no=? AND status='IN_PROGRESS' AND mcq_score IS NULL AND started_at>DATE_SUB(NOW(),INTERVAL 1 HOUR)",[grading.score,grading.total,session_id,req.principal.subject]);
         if(!changed.affectedRows){await conn.rollback();return res.status(409).json({error:'Session expired or submitted'});}
         for(const item of grading.graded)await conn.query('INSERT INTO mcq_answers(session_id,question_id,selected_option,is_correct) VALUES(?,?,?,?)',[session_id,item.questionId,item.selected,item.correct]);
         await conn.commit();
        }catch(error){await conn.rollback();throw error;}finally{conn.release();}
        const score=grading.score,total_mcq=grading.total;
        
        res.json({ success: true, score, total: total_mcq });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 4. Fetch Coding Challenges
app.get('/api/coding/:version_code', studentOnly, async (req, res) => {
    try {
        const [assigned]=await pool.query("SELECT 1 FROM quiz_sessions WHERE roll_no=? AND version_code=? AND status='IN_PROGRESS' AND mcq_score IS NOT NULL AND started_at>DATE_SUB(NOW(),INTERVAL 1 HOUR) LIMIT 1",[req.principal.subject,req.params.version_code]);
        if(!assigned.length)return res.status(403).json({error:'Complete assigned MCQs first'});
        const { version_code } = req.params;
        const [challenges] = await pool.query('SELECT challenge_code, title, description, constraints_txt, sample_input, sample_output FROM coding_challenges WHERE version_code = ?', [version_code]);
        res.json({ challenges });
    } catch (e) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Code submissions require a current student-owned session and assigned challenge.
// A row lock serializes concurrent attempts so a challenge cannot be submitted twice.
app.post('/api/submit_code',studentOnly,ownSession,active,asyncRoute(async(req,res)=>{
 const {session_id,challenge_code,code}=req.body||{};
 if(typeof challenge_code!=='string'||!/^[A-Za-z0-9_-]{1,20}$/.test(challenge_code)||
    typeof code!=='string'||code.length>20000)return res.status(400).json({error:'Invalid challenge or code'});
 if(req.quizSession.mcq_score===null)return res.status(403).json({error:'Complete MCQs first'});
 const [assigned]=await pool.query('SELECT 1 FROM coding_challenges WHERE challenge_code=? AND version_code=?',
  [challenge_code,req.quizSession.version_code]);
 if(!assigned.length)return res.status(403).json({error:'Challenge not assigned'});
 const [existing]=await pool.query('SELECT id FROM code_submissions WHERE session_id=? AND challenge_code=? LIMIT 1',
  [session_id,challenge_code]);
 if(existing.length)return res.status(409).json({error:'Challenge already submitted'});
 const [cases]=await pool.query('SELECT stdin_input,expected_output FROM test_cases WHERE challenge_code=? ORDER BY case_number LIMIT 25',[challenge_code]);
 if(!cases.length)return res.status(409).json({error:'Challenge has no test cases'});
 let verdict='ACCEPTED',casesPassed=0,details='';
 const compile=await runWithPiston(code,'');
 if(compile.type==='SERVICE_UNAVAILABLE')return res.status(503).json({error:'Code judge unavailable; retry later'});
 if(compile.error){verdict=compile.type;details=compile.message;}
 else {
  for(const tc of cases){
   const input=String(tc.stdin_input||'').replace(/\\n/g,'\n');
   const output=await runWithPiston(code,input);
   if(output.type==='SERVICE_UNAVAILABLE')return res.status(503).json({error:'Code judge unavailable; retry later'});
   if(output.error){verdict=output.type;details=output.message;break;}
   if(output.stdout.trim()!==String(tc.expected_output||'').trim()){
    verdict='WRONG_ANSWER';details='Hidden test case did not match';break;
   }
   casesPassed++;
  }
 }
 const conn=await pool.getConnection();
 try {
  await conn.beginTransaction();
  const [rows]=await conn.query('SELECT roll_no, status, started_at, mcq_score FROM quiz_sessions WHERE id=? FOR UPDATE',[session_id]);
  if(!rows.length||rows[0].roll_no!==req.principal.subject){
   await conn.rollback();return res.status(403).json({error:'Session not assigned'});
  }
  const valid=rows[0].status==='IN_PROGRESS'&&rows[0].mcq_score!==null&&
    Date.now()-new Date(rows[0].started_at).getTime()<3600000;
  if(!valid){await conn.rollback();return res.status(409).json({error:'Session finished or timed out'});}
  const [prior]=await conn.query('SELECT id FROM code_submissions WHERE session_id=? AND challenge_code=? LIMIT 1',
   [session_id,challenge_code]);
  if(prior.length){await conn.rollback();return res.status(409).json({error:'Challenge already submitted'});}
  await conn.query('INSERT INTO code_submissions (session_id,challenge_code,submitted_code,verdict,cases_passed,total_cases,compiler_output) VALUES (?,?,?,?,?,?,?)',
   [session_id,challenge_code,code,verdict,casesPassed,cases.length,details]);
  await conn.commit();
 }catch(error){await conn.rollback();throw error;}finally{conn.release();}
 res.json({success:verdict==='ACCEPTED',verdict,cases_passed:casesPassed,total_cases:cases.length,details});
}));

// Run Code (Sample Output Only)
app.post('/api/run_code', studentOnly, async (req, res) => {
    try {
        const { challenge_code, code } = req.body;
        if(typeof code!=='string'||code.length>20000)return res.status(400).json({error:'Invalid code'});
        const [owned]=await pool.query("SELECT 1 FROM coding_challenges c JOIN quiz_sessions s ON s.version_code=c.version_code WHERE c.challenge_code=? AND s.roll_no=? AND s.status='IN_PROGRESS' AND s.mcq_score IS NOT NULL AND s.started_at>DATE_SUB(NOW(),INTERVAL 1 HOUR) LIMIT 1",[challenge_code,req.principal.subject]);
        if(!owned.length)return res.status(403).json({error:'Challenge not assigned'});
        // Fetch sample input
        const [ch] = await pool.query('SELECT sample_input FROM coding_challenges WHERE challenge_code = ?', [challenge_code]);
        if (ch.length === 0) return res.status(404).json({ error: 'Challenge not found' });
        
        const input = ch[0].sample_input ? ch[0].sample_input.replace(/\\n/g, '\n') : '';
        const run = await runWithPiston(code, input);
        
        if (run.type==='SERVICE_UNAVAILABLE')return res.status(503).json({error:'Code judge unavailable; retry later'});
        if (run.error && run.type === 'COMPILE_ERROR') {
            return res.json({ success: false, verdict: 'COMPILE_ERROR', output: run.message });
        }
        
        if (run.error) {
            res.json({ success: false, verdict: run.type, output: run.message });
        } else {
            const actual = run.stdout.trim();
            res.json({ success: true, verdict: 'EXECUTED', output: actual });
        }
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Auto-Save Draft
app.post('/api/autosave', studentOnly,ownSession,active, async (req, res) => {
    try {
        const { session_id, challenge_code, saved_code } = req.body;
        if(typeof saved_code!=='string'||saved_code.length>20000)return res.status(400).json({error:'Invalid draft'});
        const [allowed]=await pool.query('SELECT 1 FROM coding_challenges WHERE challenge_code=? AND version_code=?',[challenge_code,req.quizSession.version_code]);
        if(!allowed.length)return res.status(403).json({error:'Challenge not assigned'});
        await pool.query(
            'INSERT INTO auto_saves (session_id, challenge_code, saved_code) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE saved_code = ?',
            [session_id, challenge_code, saved_code, saved_code]
        );
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/autosave/:session_id/:challenge_code', studentOnly,ownSession, async (req, res) => {
    try {
        const { session_id, challenge_code } = req.params;
        const [rows] = await pool.query('SELECT saved_code FROM auto_saves WHERE session_id = ? AND challenge_code = ?', [session_id, challenge_code]);
        res.json({ code: rows.length > 0 ? rows[0].saved_code : null });
    } catch (e) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Security Violations Logger
app.post('/api/log_violation', studentOnly,ownSession, async (req, res) => {
    try {
        const { session_id, event_type, details } = req.body;
        if(!['TAB_SWITCH','TAB_CLOSED','PASTE_ATTEMPT'].includes(event_type)||typeof details!=='string'||details.length>500)return res.status(400).json({error:'Invalid event'});
        await pool.query('INSERT INTO security_logs (session_id, event_type, details) VALUES (?, ?, ?)', [session_id, event_type, details]);
        
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Timer Sync
app.get('/api/timer_sync/:session_id', studentOnly,ownSession, (req,res)=>{const remaining=Math.max(0,Math.ceil((new Date(req.quizSession.started_at).getTime()+3600000-Date.now())/1000));res.json({time_remaining:remaining,status:req.quizSession.status});});

// Finish Assessment
app.post('/api/finish_assessment', studentOnly,ownSession, async (req, res) => {
    try {
        const { session_id } = req.body;
        if(req.quizSession.status!=='IN_PROGRESS')return res.status(409).json({error:'Already submitted'});
        const [required]=await pool.query('SELECT challenge_code FROM coding_challenges WHERE version_code=?',[req.quizSession.version_code]);
        const [done]=await pool.query('SELECT DISTINCT challenge_code FROM code_submissions WHERE session_id=?',[session_id]);
        const expired=Date.now()-new Date(req.quizSession.started_at).getTime()>=3600000;
        if(!expired&&(req.quizSession.mcq_score===null||done.length<required.length))return res.status(409).json({error:'Complete all modules first'});
        const [updated]=await pool.query("UPDATE quiz_sessions SET status='SUBMITTED',submitted_at=NOW() WHERE id=? AND roll_no=? AND status='IN_PROGRESS'",[session_id,req.principal.subject]);
        if(!updated.affectedRows)return res.status(409).json({error:'Already submitted'});
        
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin: Fetch Submissions
app.get('/api/admin/submissions', adminOnly, async (req, res) => {
    try {
        const sessions = await getSubmissions(pool);

        res.json({ success: true, submissions: sessions });
    } catch (e) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin: Fetch Violations
app.get('/api/admin/violations', adminOnly, async (req, res) => {
    try {
        const [logs] = await pool.query(`
            SELECT sl.id, sl.session_id, sl.event_type, sl.details, sl.logged_at,
                   qs.roll_no, st.full_name
            FROM security_logs sl
            LEFT JOIN quiz_sessions qs ON sl.session_id = qs.id
            LEFT JOIN students st ON qs.roll_no = st.roll_no
            ORDER BY sl.id DESC LIMIT 100
        `);
        
        const [summary] = await pool.query(`
            SELECT qs.roll_no, st.full_name, qs.started_at,
                   (SELECT COUNT(*) FROM security_logs WHERE session_id = qs.id AND event_type = 'TAB_SWITCH') as tab_switches,
                   (SELECT COUNT(*) FROM security_logs WHERE session_id = qs.id AND event_type = 'PASTE_ATTEMPT') as pastes,
                   (SELECT SUM(cases_passed) FROM code_submissions WHERE session_id = qs.id) as cases_passed,
                   (SELECT SUM(total_cases) FROM code_submissions WHERE session_id = qs.id) as cases_total
            FROM quiz_sessions qs
            JOIN students st ON qs.roll_no = st.roll_no
            WHERE qs.status = 'IN_PROGRESS'
            ORDER BY qs.started_at DESC
        `);
        
        res.json({ violations: logs, summary: summary });
    } catch (e) {
        res.status(500).json({ error: 'Internal server error' });
    }
});


if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}
module.exports = app;
