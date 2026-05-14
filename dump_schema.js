const mysql = require('mysql2/promise');

async function dump() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'quiz'
        });

        const [tables] = await connection.query('SHOW TABLES');
        for (const row of tables) {
            const tableName = Object.values(row)[0];
            console.log(`\n--- TABLE: ${tableName} ---`);
            const [cols] = await connection.query(`DESCRIBE ${tableName}`);
            console.table(cols);
        }
        await connection.end();
    } catch (e) {
        console.error(e);
    }
}
dump();
