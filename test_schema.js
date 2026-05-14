const mysql = require('mysql2/promise');

async function test() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'quiz'
        });

        console.log("\n--- TABLE: quiz_sessions ---");
        const [cols] = await connection.query(`DESCRIBE quiz_sessions`);
        console.table(cols);
        
        console.log("\n--- TABLE: code_submissions ---");
        const [cols2] = await connection.query(`DESCRIBE code_submissions`);
        console.table(cols2);

        await connection.end();
    } catch (e) {
        console.error(e);
    }
}
test();
