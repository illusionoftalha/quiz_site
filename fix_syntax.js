const fs = require('fs');
let f = fs.readFileSync('public/dashboard.html', 'utf8');
f = f.replace(/\\\`/g, '`');
f = f.replace(/\\\${/g, '${');
fs.writeFileSync('public/dashboard.html', f);
console.log('Syntax fixed.');
