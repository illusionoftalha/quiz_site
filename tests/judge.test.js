'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {runWithPiston}=require('../lib/judge');
test('successful code execution returns stdout',async()=>{
 const r=await runWithPiston('int main(){}','',async()=>({ok:true,json:async()=>({run:{code:0,stdout:'ok'}})}));
 assert.deepEqual(r,{error:false,stdout:'ok'});
});
test('compilation failures are distinct from service outages',async()=>{
 const compile=await runWithPiston('broken','',async()=>({ok:true,json:async()=>({compile:{code:1,output:'syntax error'},run:{code:0,stdout:''}})}));
 assert.equal(compile.type,'COMPILE_ERROR');
 const outage=await runWithPiston('test','',async()=>({ok:false}));
 assert.equal(outage.type,'SERVICE_UNAVAILABLE');
 const invalid=await runWithPiston('test','',async()=>({ok:true,json:async()=>({})}));
 assert.equal(invalid.type,'SERVICE_UNAVAILABLE');
});
test('transport exceptions do not falsely fail student submissions',async()=>{
 const r=await runWithPiston('test','',async()=>{throw Error('offline')});
 assert.equal(r.type,'SERVICE_UNAVAILABLE');
});
test('input size is limited',async()=>{
 const r=await runWithPiston('x'.repeat(20001));
 assert.equal(r.type,'SERVICE_UNAVAILABLE');
});
