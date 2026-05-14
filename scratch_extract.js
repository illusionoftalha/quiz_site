const fs = require('fs');
const html = fs.readFileSync('public/admin.html', 'utf8');
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
if (scriptMatch) {
  fs.writeFileSync('scratch_admin_script.js', scriptMatch[1]);
  console.log('Script extracted');
} else {
  console.log('No script found');
}
