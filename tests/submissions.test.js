const test = require('node:test');
const assert = require('node:assert/strict');
const { getSubmissions } = require('../lib/submissions');

test('loads coding submissions in batches instead of one query per session', async () => {
    const sessions = Array.from({ length: 1000 }, (_, id) => ({ session_id: id + 1 }));
    const calls = [];
    const pool = { async query(sql, params) {
        calls.push({ sql, params });
        if (calls.length === 1) return [sessions];
        assert.match(sql, /WHERE session_id IN \(\?\)/);
        assert.ok(params[0].length <= 500);
        return [params[0].map(id => ({ session_id: id, challenge_code: `C${id}` }))];
    } };
    const result = await getSubmissions(pool);
    assert.equal(calls.length, 3); // Previously: 1001 queries.
    assert.deepEqual(calls[1].params[0], sessions.slice(0, 500).map(s => s.session_id));
    assert.deepEqual(calls[2].params[0], sessions.slice(500).map(s => s.session_id));
    assert.deepEqual(result[999].coding, [{ challenge_code: 'C1000' }]);
});

test('preserves session order, coding fields and empty coding arrays', async () => {
    const sessions = [{ session_id: 7, full_name: 'Ada' }, { session_id: 2 }, { session_id: 9 }];
    const coding = { challenge_code: 'C01', verdict: 'ACCEPTED', cases_passed: 2,
        total_cases: 2, submitted_code: 'source', compiler_output: '' };
    let calls = 0;
    const pool = { async query() {
        return ++calls === 1 ? [sessions] : [[{ session_id: '2', ...coding }]];
    } };
    const result = await getSubmissions(pool);
    assert.deepEqual(result.map(s => s.session_id), [7, 2, 9]);
    assert.deepEqual(result[0], { session_id: 7, full_name: 'Ada', coding: [] });
    assert.deepEqual(result[1].coding, [coding]);
    assert.deepEqual(result[2].coding, []);
    assert.equal(sessions[0].coding, undefined);
});

test('does not query coding submissions when no sessions exist', async () => {
    let calls = 0;
    assert.deepEqual(await getSubmissions({ async query() { calls++; return [[]]; } }), []);
    assert.equal(calls, 1);
});

test('propagates query failures for the existing route error handler', async () => {
    await assert.rejects(getSubmissions({ async query() { throw new Error('database offline'); } }),
        /database offline/);
});
