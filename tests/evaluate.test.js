'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { evaluateCode } = require('../lib/evaluate');

test('programs requiring stdin are never run with a fabricated empty input', async () => {
  const inputs = [];
  const result = await evaluateCode('program', [{ stdin_input: '42\\n', expected_output: '42' }], async (_, input) => {
    inputs.push(input);
    return input ? { stdout: '42\n' } : { error: true, type: 'RUNTIME_ERROR' };
  });
  assert.deepEqual(inputs, ['42\n']);
  assert.equal(result.verdict, 'ACCEPTED');
  assert.equal(result.casesPassed, 1);
});
test('judge outage after a passing test does not become a student failure', async () => {
  let calls = 0;
  const result = await evaluateCode('program', [{}, {}], async () => ++calls === 1
    ? { stdout: '' } : { error: true, type: 'SERVICE_UNAVAILABLE' });
  assert.deepEqual(result, { unavailable: true });
});
test('wrong output preserves partial credit without exposing hidden answers', async () => {
  const result = await evaluateCode('program', [{ expected_output: 'secret' }], async () => ({ stdout: 'wrong' }));
  assert.equal(result.verdict, 'WRONG_ANSWER');
  assert.equal(result.casesPassed, 0);
  assert.ok(!result.details.includes('secret'));
});
