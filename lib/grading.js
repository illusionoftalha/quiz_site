'use strict';
function gradeAnswers(questions, answers) {
  if (!Array.isArray(questions) || !questions.length || questions.length > 300 ||
      !Array.isArray(answers) || answers.length !== questions.length) {
    throw new Error('Submit exactly one answer per assigned question');
  }
  const byId = new Map(questions.map(q => [Number(q.id), q]));
  if (byId.size !== questions.length) throw new Error('Duplicate question identifiers');
  const seen = new Set();
  let score = 0;
  const graded = [];
  for (const answer of answers) {
    if (!answer || !Number.isSafeInteger(answer.q_id) ||
        !Number.isInteger(answer.selected_opt) || answer.selected_opt < 0 || answer.selected_opt > 3 ||
        seen.has(answer.q_id) || !byId.has(answer.q_id)) {
      throw new Error('Invalid or duplicate answer');
    }
    seen.add(answer.q_id);
    const correct = Number(byId.get(answer.q_id).correct_option) === answer.selected_opt;
    if (correct) score++;
    graded.push({ questionId: answer.q_id, selected: answer.selected_opt, correct });
  }
  return { score, total: questions.length, graded };
}
module.exports = { gradeAnswers };
