const express = require('express');
const {pool} = require('./lib/db');
const auth = require('./lib/auth');
const {gradeAnswers} = require('./lib/grading');
const cors = require('cors');
const { getSubmissions } = require('./lib/submissions');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process'); // No longer needed, kept for reference but unused

const app = express();
const PORT = process.env.PORT || 3000;

app.disable('x-powered-by');
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

// Start Assessment Session
app.post('/api/start_assessment', studentOnly, async (req, res) => {
    try {
        const {version_code}=req.body;const roll_no=req.principal.subject;
        const [assigned]=await pool.query('SELECT version_code FROM quiz_versions WHERE roll_no=? AND version_code=?',[roll_no,version_code]);
        if(!assigned.length)return res.status(403).json({error:'Assessment not assigned'});
        
        // Check if an active session already exists
        const [existing] = await pool.query('SELECT * FROM quiz_sessions WHERE roll_no = ? AND version_code = ? ORDER BY id DESC LIMIT 1', [roll_no, version_code]);
        if (existing.length > 0) {
            const session_id = existing[0].id;
            const [submissions] = await pool.query('SELECT challenge_code FROM code_submissions WHERE session_id = ?', [session_id]);
            const coding_submissions = submissions.map(s => s.challenge_code);

            return res.json({ 
                success: true, 
                session_id: session_id, 
                session_token: existing[0].session_token,
                mcq_submitted: existing[0].mcq_score !== null,
                coding_submissions: coding_submissions
            });
        }
        
        const session_token = require('crypto').randomBytes(32).toString('hex');
        const [result] = await pool.query('INSERT INTO quiz_sessions (session_token, roll_no, version_code) VALUES (?, ?, ?)', [session_token, roll_no, version_code]);
        
        // Trigger WhatsApp alert for exam start
        const messageText = `🚀 Student ${roll_no} has STARTED the assessment!`;
        // External notifications removed: never commit provider credentials.

        res.json({ success: true, session_id: result.insertId, session_token, mcq_submitted: false, coding_submissions: [] });
    } catch (e) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 2. Fetch MCQ Questions
app.get('/api/mcq/:version_code', studentOnly, async (req, res) => {
    try {
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
        const { version_code } = req.params;
        const [challenges] = await pool.query('SELECT challenge_code, title, description, constraints_txt, sample_input, sample_output FROM coding_challenges WHERE version_code = ?', [version_code]);
        res.json({ challenges });
    } catch (e) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Helper for running code via Piston API
async function runWithPiston(code, inputData = '') {
    try {
        const payload = {
            language: "c",
            version: "*",
            files: [{ content: code }],
            stdin: inputData,
            compile_timeout: 10000,
            run_timeout: 3000
        };
        const response = await fetch('https://emacs.piston.rs/api/v2/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        
        if (result.compile && result.compile.code !== 0) {
            return { error: true, type: 'COMPILE_ERROR', message: result.compile.output };
        }
        if (result.run && result.run.code !== 0) {
            let type = result.run.signal === 'SIGKILL' ? 'TIME_LIMIT' : 'RUNTIME_ERROR';
            return { error: true, type: type, message: result.run.output };
        }
        return { error: false, stdout: result.run ? result.run.stdout : '' };
    } catch (e) {
        return { error: true, type: 'RUNTIME_ERROR', message: e.message };
    }
}

// 5. Submit & Evaluate Code
app.post('/api/submit_code', studentOnly,ownSession,active, async (req, res) => {
    try {
        const { session_id, challenge_code, code } = req.body;
        
        // Compile Check via Piston
        const compileCheck = await runWithPiston(code, '');
        
        if (compileCheck.error && compileCheck.type === 'COMPILE_ERROR') {
            await pool.query(
                'INSERT INTO code_submissions (session_id, challenge_code, submitted_code, verdict, compiler_output) VALUES (?, ?, ?, ?, ?)',
                [session_id, challenge_code, code, 'COMPILE_ERROR', compileCheck.message]
            );
            return res.json({ success: false, verdict: 'COMPILE_ERROR', output: compileCheck.message });
        }
        
        // Fetch test cases
        const [testCases] = await pool.query('SELECT * FROM test_cases WHERE challenge_code = ?', [challenge_code]);
        let casesPassed = 0;
        let finalVerdict = 'ACCEPTED';
        let firstFailedOutput = '';
        
        for (const tc of testCases) {
            const input = tc.stdin_input ? tc.stdin_input.replace(/\\n/g, '\n') : '';
            const run = await runWithPiston(code, input);
            
            if (run.error) {
                finalVerdict = run.type; // RUNTIME_ERROR or TIME_LIMIT
                firstFailedOutput = run.message;
                break;
            }
            
            // Compare outputs (trim trailing whitespace/newlines)
            const actual = run.stdout.trim();
            const expected = tc.expected_output ? tc.expected_output.trim() : '';
            
            if (actual === expected) {
                casesPassed++;
            } else {
                finalVerdict = 'WRONG_ANSWER';
                firstFailedOutput = `[ INPUT ]\n${input}\n\n[ EXPECTED OUTPUT ]\n${expected}\n\n[ ACTUAL OUTPUT ]\n${actual}`;
                break;
            }
        }
        
        if (testCases.length === 0) return res.status(409).json({error:'No test cases configured'});
        
        await pool.query(
            'INSERT INTO code_submissions (session_id, challenge_code, submitted_code, verdict, cases_passed, total_cases, compiler_output) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [session_id, challenge_code, code, finalVerdict, casesPassed, testCases.length, firstFailedOutput]
        );
        
        res.json({ success: finalVerdict === 'ACCEPTED', verdict: finalVerdict, cases_passed: casesPassed, total_cases: testCases.length, details: firstFailedOutput });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Run Code (Sample Output Only)
app.post('/api/run_code', studentOnly, async (req, res) => {
    try {
        const { challenge_code, code } = req.body;
        
        // Fetch sample input
        const [ch] = await pool.query('SELECT sample_input, sample_output FROM coding_challenges WHERE challenge_code = ?', [challenge_code]);
        if (ch.length === 0) return res.status(404).json({ error: 'Challenge not found' });
        
        const input = ch[0].sample_input ? ch[0].sample_input.replace(/\\n/g, '\n') : '';
        const run = await runWithPiston(code, input);
        
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
        await pool.query('INSERT INTO security_logs (session_id, event_type, details) VALUES (?, ?, ?)', [session_id, event_type, details]);
        
        // WhatsApp Notification via TextMeBot
        try {
            const [sessionRows] = await pool.query('SELECT roll_no FROM quiz_sessions WHERE id = ?', [session_id]);
            if (sessionRows.length > 0) {
                const roll_no = sessionRows[0].roll_no;
                
                let messageText = '';
                if (event_type === 'TAB_SWITCH') {
                    messageText = `🚨 Roll No ${roll_no} has switched tab`;
                } else if (event_type === 'TAB_CLOSED') {
                    messageText = `🚨 Roll No ${roll_no} has closed the tab`;
                } else {
                    messageText = `🚨 Roll No ${roll_no} triggered a ${event_type} violation!`;
                }

                // External notifications removed: never commit provider credentials.
            }
        } catch (botErr) {
            console.error('Error triggering WhatsApp bot:', botErr.message);
        }

        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Timer Sync
app.get('/api/timer_sync/:session_id', studentOnly,ownSession, async (req, res) => {
    try {
        const { session_id } = req.params;
        const [rows] = await pool.query('SELECT time_remaining, status FROM quiz_sessions WHERE id = ?', [session_id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Session not found' });
        
        let tr = rows[0].time_remaining;
        if (rows[0].status === 'IN_PROGRESS' && tr > 0) {
            // Very naive countdown implementation on fetch for now, a proper implementation would use background workers or calculate delta from started_at.
            // Since we sync every 10 seconds, we can just decrease it by 10.
            // Actually, best to let the client decrement and server just validates or we just return the current value.
            // Let's implement a simple tick on the server side when this is called.
            tr -= 10;
            if (tr < 0) tr = 0;
            await pool.query('UPDATE quiz_sessions SET time_remaining = ? WHERE id = ?', [tr, session_id]);
        }
        res.json({ time_remaining: tr, status: rows[0].status });
    } catch (e) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Finish Assessment
app.post('/api/finish_assessment', studentOnly,ownSession, async (req, res) => {
    try {
        const { session_id } = req.body;
        await pool.query('UPDATE quiz_sessions SET status = ?, submitted_at = CURRENT_TIMESTAMP WHERE id = ?', ['SUBMITTED', session_id]);
        
        // Fetch session data to send WhatsApp notification
        try {
            const [rows] = await pool.query('SELECT roll_no, mcq_score, total_mcq FROM quiz_sessions WHERE id = ?', [session_id]);
            if (rows.length > 0) {
                const roll_no = rows[0].roll_no;
                const mcq_score = rows[0].mcq_score !== null ? rows[0].mcq_score : 0;
                const total_mcq = rows[0].total_mcq !== null ? rows[0].total_mcq : 0;
                
                const [codes] = await pool.query('SELECT SUM(cases_passed) as passed, SUM(total_cases) as total FROM code_submissions WHERE session_id = ?', [session_id]);
                const casesPassed = codes[0].passed || 0;
                const casesTotal = codes[0].total || 0;
                
                const messageText = `✅ Student ${roll_no} has SUBMITTED the test!\nMCQ Score: ${mcq_score}/${total_mcq}\nTest Cases: ${casesPassed}/${casesTotal}`;
                // External notifications removed: never commit provider credentials.
            }
        } catch (botErr) {
            console.error('Error triggering WhatsApp bot:', botErr.message);
        }

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
