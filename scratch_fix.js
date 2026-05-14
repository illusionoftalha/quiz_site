const mysql = require('mysql2/promise');
async function run() {
    const pool = mysql.createPool({host: 'localhost', user: 'root', password: '', database: 'quiz'});
    try {
        await pool.query('UPDATE quiz_sessions SET submitted_at = CURRENT_TIMESTAMP WHERE id = 2');
        await pool.query('INSERT INTO code_submissions (session_id, challenge_code, submitted_code, verdict, cases_passed, total_cases, compiler_output) VALUES (?, ?, ?, ?, ?, ?, ?)', [2, 'C01', '#include <stdio.h>\nint main() {\n  printf("Hello World");\n  return 0;\n}', 'ACCEPTED', 5, 5, '']);
        console.log('Fixed test account data');
    } catch(e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
