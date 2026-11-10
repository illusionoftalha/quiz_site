'use strict';
const { runWithPiston } = require('./judge');

// Execute only with assigned inputs. An empty-input "compile check" also runs
// the program and can reject valid programs that require stdin.
async function evaluateCode(code, cases, run = runWithPiston) {
  let casesPassed = 0;
  for (const testCase of cases) {
    const result = await run(code, String(testCase.stdin_input || '').replace(/\\n/g, '\n'));
    if (result.type === 'SERVICE_UNAVAILABLE') return { unavailable: true };
    if (result.error) return { verdict: result.type, casesPassed, details: result.message };
    if (result.stdout.trim() !== String(testCase.expected_output || '').trim()) {
      return { verdict: 'WRONG_ANSWER', casesPassed, details: 'Hidden test case did not match' };
    }
    casesPassed++;
  }
  return { verdict: 'ACCEPTED', casesPassed, details: '' };
}
module.exports = { evaluateCode };
