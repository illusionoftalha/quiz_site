const mysql = require('mysql2/promise');
async function run() {
    const pool = mysql.createPool({host: 'localhost', user: 'root', password: '', database: 'quiz'});
    try {
        await pool.query('DELETE FROM coding_challenges WHERE challenge_code = ?', ['C01']);
        await pool.query('DELETE FROM mcq_questions WHERE version_code = ?', ['V_TEST']);
        await pool.query('INSERT INTO mcq_questions (version_code, q_number, lab_tag, topic, question_text, option_a, option_b, option_c, option_d, correct_option) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', ['V_TEST', 1, 'LAB01', 'Basics', 'What is 2 + 2?', '3', '4', '5', '6', 1]);
        await pool.query('INSERT INTO coding_challenges (version_code, challenge_code, title, description, constraints_txt, sample_input, sample_output) VALUES (?, ?, ?, ?, ?, ?, ?)', ['V_TEST', 'C01', 'Hello World', 'Print Hello World to the console.', 'None', 'None', 'Hello World']);
        console.log('Test questions added.');
    } catch(e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
