const mysql = require('mysql2/promise');

async function test() {
    try {
        const pool = mysql.createPool({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'quiz'
        });

        const session_id = 1;
        const version_code = 'V000';

        console.log("Testing MCQ query...");
        const [mcqs] = await pool.query(`
            SELECT mq.q_number, mq.question_text, mq.correct_option, mq.option_a, mq.option_b, mq.option_c, mq.option_d,
                   ma.selected_option, ma.is_correct
            FROM mcq_questions mq
            LEFT JOIN mcq_answers ma ON mq.id = ma.question_id AND ma.session_id = ?
            WHERE mq.version_code = ?
            ORDER BY mq.q_number
        `, [session_id, version_code]);
        console.log("MCQ query success.", mcqs.length);

        console.log("Testing Coding query...");
        const [coding] = await pool.query(`
            SELECT challenge_code, submitted_code, verdict, cases_passed, total_cases, compiler_output, submitted_at
            FROM code_submissions 
            WHERE session_id = ? 
            ORDER BY submitted_at DESC
        `, [session_id]);
        console.log("Coding query success.", coding.length);

        await pool.end();
    } catch (e) {
        console.error("ERROR CAUGHT:");
        console.error(e.message);
        process.exit(1);
    }
}
test();
