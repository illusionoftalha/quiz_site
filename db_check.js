const mysql = require('mysql2/promise');

async function run() {
    const pool = mysql.createPool({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'quiz'
    });

    try {
        const [tables] = await pool.query('SHOW TABLES');
        console.log('Tables:', tables);

        const [codingDesc] = await pool.query('DESCRIBE coding_challenges');
        console.log('coding_challenges schema:', codingDesc);

        const [mcqDesc] = await pool.query('DESCRIBE mcq_questions');
        console.log('mcq_questions schema:', mcqDesc);

        const [quizVersions] = await pool.query('SELECT * FROM quiz_versions');
        console.log('quiz_versions:', quizVersions);
        
        const [students] = await pool.query('SELECT * FROM students');
        console.log('students:', students);

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
