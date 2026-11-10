'use strict';
async function initializeSchema(pool) {
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
}
module.exports = { initializeSchema };
