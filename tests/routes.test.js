'use strict';
const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {tokenHash}=require('../lib/auth');
const studentToken='S'.repeat(43);
const adminToken='A'.repeat(43);
const studentDigest=tokenHash(studentToken),adminDigest=tokenHash(adminToken);
const requests=[];
const fakePool={
 async query(sql,params=[]){
  requests.push({sql,params});
  if(sql.includes('FROM auth_sessions')){
   if(params[0]===studentDigest)return [[{role:'student',subject:'S1'}]];
   if(params[0]===adminDigest)return [[{role:'admin',subject:'administrator'}]];
   return [[]];
  }
  if(sql.includes('FROM quiz_sessions WHERE id='))return [[{
   id:42,roll_no:'S2',version_code:'V1',status:'IN_PROGRESS',
   started_at:new Date(),mcq_score:null
  }]];
  throw Error('Unexpected database query: '+sql);
 }
};
const dbId=require.resolve('../lib/db');
require.cache[dbId]={id:dbId,filename:dbId,loaded:true,exports:{pool:fakePool}};
const app=require('../server');
const server=app.listen(0,'127.0.0.1');
before(async()=>{if(!server.listening)await require('node:events').once(server,'listening');});
after(async()=>{await new Promise(resolve=>server.close(resolve));delete require.cache[dbId]});
function url(route){return 'http://127.0.0.1:'+server.address().port+route}
function cookie(token){return {cookie:'quiz_auth='+token}}
test('unauthenticated admin submissions rejected',async()=>{
 const res=await fetch(url('/api/admin/submissions'));
 assert.equal(res.status,401);
});
test('student may not use admin endpoints',async()=>{
 const res=await fetch(url('/api/admin/submissions'),{headers:cookie(studentToken)});
 assert.equal(res.status,403);
});
test('student cannot read another student results',async()=>{
 const res=await fetch(url('/api/student/results/S2'),{headers:cookie(studentToken)});
 assert.equal(res.status,403);
});
test('student cannot read another student autosave',async()=>{
 const res=await fetch(url('/api/autosave/42/CH1'),{headers:cookie(studentToken)});
 assert.equal(res.status,403);
});
test('unauthenticated writes rejected',async()=>{
 const old=process.env.APP_ORIGIN;
 process.env.APP_ORIGIN=url('/');
 try{
  const res=await fetch(url('/api/start_assessment'),{
   method:'POST',headers:{'Origin':url('/'),'Content-Type':'application/json'},
   body:JSON.stringify({version_code:'V1'})
  });
  assert.equal(res.status,401);
 }finally{if(old===undefined)delete process.env.APP_ORIGIN;else process.env.APP_ORIGIN=old;}
});
test('wrong-origin writes rejected before accessing database',async()=>{
 const old=process.env.APP_ORIGIN;
 process.env.APP_ORIGIN=url('/');
 try{
  const res=await fetch(url('/api/start_assessment'),{
   method:'POST',headers:{...cookie(studentToken),'Origin':'https://evil.example','Content-Type':'application/json'},
   body:JSON.stringify({version_code:'V1'})
  });
  assert.equal(res.status,403);
 }finally{if(old===undefined)delete process.env.APP_ORIGIN;else process.env.APP_ORIGIN=old;}
});

test('malformed and oversized bodies return safe JSON errors',async()=>{
 for(const [body,status,message] of [['{',400,'Invalid JSON'],[JSON.stringify({value:'x'.repeat(110000)}),413,'Request body too large']]){
  const res=await fetch(url('/api/start_assessment'),{method:'POST',headers:{'Content-Type':'application/json'},body});
  assert.equal(res.status,status);
  assert.deepEqual(await res.json(),{error:message});
 }
});
test('unknown API endpoints return JSON rather than an HTML error page',async()=>{
 const res=await fetch(url('/api/missing'));
 assert.equal(res.status,404);
 assert.deepEqual(await res.json(),{error:'API endpoint not found'});
});
