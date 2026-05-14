const mysql=require('mysql2/promise'); 
async function seedTest() { 
  const c = await mysql.createConnection({host:'localhost',user:'root',database:'quiz'}); 
  await c.query('INSERT IGNORE INTO quiz_versions (version_code, roll_no, total_questions) VALUES (?, ?, ?)', ['V_TEST', 'test', 2]); 
  await c.query('INSERT INTO mcq_questions (version_code, q_number, topic, question_text, option_a, option_b, option_c, option_d, correct_option) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', ['V_TEST', 1, 'TEST', 'Test Question 1?', 'A', 'B', 'C', 'D', 0]); 
  await c.query('INSERT INTO mcq_questions (version_code, q_number, topic, question_text, option_a, option_b, option_c, option_d, correct_option) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', ['V_TEST', 2, 'TEST', 'Test Question 2?', 'Yes', 'No', 'Maybe', 'Always', 1]); 
  await c.query('UPDATE quiz_versions SET total_questions = 2 WHERE version_code = "V_TEST"'); 
  await c.query('INSERT INTO coding_challenges (version_code, challenge_code, title, description, constraints_txt, sample_input, sample_output) VALUES (?, ?, ?, ?, ?, ?, ?)', ['V_TEST', 'V_TEST_C1', 'Test Coding Challenge', 'Write a program that prints exactly "Hello World".', 'None', '', 'Hello World']); 
  await c.query('INSERT INTO test_cases (challenge_code, stdin_input, expected_output, case_number) VALUES (?, ?, ?, ?)', ['V_TEST_C1', '', 'Hello World', 1]); 
  console.log('Test questions added.'); 
  c.end(); 
} 
seedTest();
