'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const auth = require('../lib/auth');
const {gradeAnswers} = require('../lib/grading');

test('password hashing is salted and verifiable', async () => {
 const a=await auth.hashPassword('correct horse battery staple');
 const b=await auth.hashPassword('correct horse battery staple');
 assert.notEqual(a,b);
 assert.equal(await auth.verifyPassword('correct horse battery staple',a),true);
 assert.equal(await auth.verifyPassword('incorrect password',a),false);
 assert.equal(await auth.verifyPassword('anything','root'),false);
 await assert.rejects(auth.hashPassword('short'));
});
test('authentication uses opaque HttpOnly cookies', () => {
 const token='A'.repeat(43);
 assert.match(auth.authCookie(token,'https://quiz.example.com'),/HttpOnly; SameSite=Strict; Max-Age=28800; Secure/);
 const req={headers:{cookie:'other=1; quiz_auth='+token+'; test=2'}};
 assert.equal(auth.tokenFromRequest(req),token);
 assert.equal(auth.tokenFromRequest({headers:{cookie:'quiz_auth=bad'}}),null);
 assert.equal(auth.tokenHash(token).length,64);
});
test('exact zero-based grading, not approximate option matching', () => {
 const questions=[{id:1,correct_option:0},{id:2,correct_option:2}];
 const graded=gradeAnswers(questions,[{q_id:1,selected_opt:1},{q_id:2,selected_opt:2}]);
 assert.equal(graded.score,1);
 assert.equal(graded.total,2);
});
test('invalid, foreign and repeated MCQ answers are rejected',()=>{
 const q=[{id:1,correct_option:0},{id:2,correct_option:2}];
 for(const a of [
  [{q_id:1,selected_opt:0},{q_id:1,selected_opt:0}],
  [{q_id:1,selected_opt:0},{q_id:3,selected_opt:0}],
  [{q_id:1,selected_opt:4},{q_id:2,selected_opt:2}],
  [{q_id:1,selected_opt:0}],
  [{q_id:1,selected_opt:0},{q_id:2,selected_opt:-1}]
 ])assert.throws(()=>gradeAnswers(q,a));
});
test('repeated bad credentials result in a temporary lockout',()=>{
 const req={ip:'unique-test-ip-84720'};
 for(let i=0;i<5;i++)auth.loginFailed(req,'unique-user-84720');
 assert.ok(auth.loginLimited(req,'unique-user-84720'));
 assert.ok(!auth.loginLimited(req,'other-user-84720'));
 auth.loginSucceeded(req,'unique-user-84720');
 assert.ok(!auth.loginLimited(req,'unique-user-84720'));
});
test('CSRF origin validation rejects cross-site requests',()=>{
 const original=process.env.APP_ORIGIN;
 process.env.APP_ORIGIN='https://quiz.example.com';
 try {
  let status=0,passed=false;
  const res={status(n){status=n;return this;},json(){return this;}};
  auth.sameOrigin({method:'POST',get:()=> 'https://evil.example',is:()=>true},res,()=>{passed=true});
  assert.equal(status,403);assert.equal(passed,false);
  auth.sameOrigin({method:'POST',get:()=> 'https://quiz.example.com',is:()=>true},res,()=>{passed=true});
  assert.equal(passed,true);
 } finally {
  if(original===undefined)delete process.env.APP_ORIGIN;
  else process.env.APP_ORIGIN=original;
 }
});
test('role middleware denies unauthenticated and mismatched principals',async()=>{
 const database={async query(){return [[{role:'student',subject:'STUDENT-1'}]];}};
 const middleware=auth.requireRole(database,'admin');
 const token='B'.repeat(43);
 const req={headers:{cookie:'quiz_auth='+token}};
 let status=null,called=false;
 const res={status(s){status=s;return this;},json(){return this;}};
 await middleware(req,res,()=>{called=true});
 assert.equal(status,403);
 assert.equal(called,false);
 await middleware({headers:{cookie:''}},res,()=>{called=true});
 assert.equal(status,401);
});
