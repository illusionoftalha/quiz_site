const BATCH_SIZE = 500;

async function getSubmissions(pool) {
    const [sessions] = await pool.query(`
        SELECT qs.id as session_id, qs.roll_no, st.full_name, qs.mcq_score, qs.total_mcq, qs.submitted_at
        FROM quiz_sessions qs
        JOIN students st ON qs.roll_no = st.roll_no
        WHERE qs.status = 'SUBMITTED'
        ORDER BY qs.submitted_at DESC
    `);
    const codingBySession = new Map();
    for (let offset = 0; offset < sessions.length; offset += BATCH_SIZE) {
        const ids = sessions.slice(offset, offset + BATCH_SIZE).map(session => session.session_id);
        const [rows] = await pool.query(`
            SELECT session_id, challenge_code, verdict, cases_passed, total_cases, submitted_code, compiler_output
            FROM code_submissions WHERE session_id IN (?)
        `, [ids]);
        for (const { session_id, ...coding } of rows) {
            const key = String(session_id);
            if (!codingBySession.has(key)) codingBySession.set(key, []);
            codingBySession.get(key).push(coding);
        }
    }
    return sessions.map(session => ({
        ...session,
        coding: codingBySession.get(String(session.session_id)) || [],
    }));
}

module.exports = { getSubmissions };
