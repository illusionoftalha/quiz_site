const mysql = require('mysql2/promise');

async function addTestUser() {
    const pool = mysql.createPool({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'quiz'
    });

    try {
        // Check if 'test' user exists
        const [existing] = await pool.query('SELECT * FROM students WHERE roll_no = "test"');
        if (existing.length === 0) {
            await pool.query('INSERT INTO students (roll_no, full_name, quiz_labs) VALUES (?, ?, ?)', ['test', 'Test User', 8]);
            console.log('Added test student.');
        } else {
            console.log('Test student already exists.');
        }

        // Check if 'test' has a quiz version
        const [existingVersion] = await pool.query('SELECT * FROM quiz_versions WHERE roll_no = "test"');
        if (existingVersion.length === 0) {
            await pool.query('INSERT INTO quiz_versions (version_code, roll_no, total_questions) VALUES (?, ?, ?)', ['V_TEST', 'test', 30]);
            console.log('Assigned version V007 to test user.');
        } else {
            console.log('Test user already has a quiz version.');
        }
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

addTestUser();
