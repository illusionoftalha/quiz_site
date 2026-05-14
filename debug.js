const mysql = require('mysql2/promise');

async function test() {
    const c = await mysql.createConnection({host:'localhost',user:'root',database:'quiz'});
    const [v] = await c.query('SELECT * FROM quiz_versions');
    console.log("VERSIONS:", v);
    const [s] = await c.query('SELECT * FROM students');
    console.log("STUDENTS:", s);
    c.end();
}
test();
