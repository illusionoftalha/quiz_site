const mysql = require('mysql2/promise');

async function test() {
    const c = await mysql.createConnection({host:'localhost',user:'root',database:'quiz'});
    const [qs] = await c.query('DESCRIBE quiz_sessions');
    console.table(qs);
    c.end();
}
test();
