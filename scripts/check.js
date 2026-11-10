'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {execFileSync} = require('node:child_process');
const root = path.join(__dirname, '..');
let checked = 0;
for (const dir of ['lib', 'scripts', 'tests', 'public']) {
  for (const file of fs.readdirSync(path.join(root, dir))) {
    const name = path.join(root, dir, file);
    if (file.endsWith('.js')) {
      execFileSync(process.execPath, ['--check', name]); checked++;
    } else if (file.endsWith('.html')) {
      const html = fs.readFileSync(name, 'utf8');
      for (const [, attributes, script] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
        if (/\bsrc\s*=|application\/ld\+json/i.test(attributes)) continue;
        new vm.Script(script, {filename: name}); checked++;
      }
    }
  }
}
execFileSync(process.execPath, ['--check', path.join(root, 'server.js')]);
console.log(`Syntax valid: ${checked + 1} JavaScript files and inline scripts`);
