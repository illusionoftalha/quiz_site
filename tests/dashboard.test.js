'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'../public/dashboard.html'),'utf8');
function section(start,end){return html.slice(html.indexOf(start),html.indexOf(end));}
const tick=()=>new Promise(resolve=>setImmediate(resolve));

test('debounced drafts retain the session, problem and text from input time',async()=>{
 let onInput;
 const timers=new Map(),requests=[];
 let id=0;
 const context=vm.createContext({localDrafts:new Map(),sessionId:1,codingIndex:0,codingData:[{challenge_code:'A'},{challenge_code:'B'}],
  document:{getElementById:()=>({addEventListener:(_,fn)=>{onInput=fn;}})},
  setTimeout:fn=>{timers.set(++id,fn);return id;},clearTimeout:key=>timers.delete(key),
  fetch:async(_,options)=>requests.push(JSON.parse(options.body))});
 vm.runInContext(section('// Capture identity and text','// --- TIMER ENGINE ---'),context);
 const editor={value:'answer A',disabled:false};onInput({target:editor});
 context.codingIndex=1;editor.value='answer B';onInput({target:editor});
 context.sessionId=2;editor.value='unrelated later text';
 for(const fn of timers.values())fn();
 await tick();
 assert.deepEqual(requests,[{session_id:1,challenge_code:'A',saved_code:'answer A'},
  {session_id:1,challenge_code:'B',saved_code:'answer B'}]);
});

test('late draft responses cannot overwrite a newly selected problem; blank drafts stay blank',async()=>{
 const nodes=new Map();
 const node=id=>{if(!nodes.has(id))nodes.set(id,{style:{}});return nodes.get(id);};
 const replies=[];
 const context=vm.createContext({localDrafts:new Map(),draftLoadId:0,sessionId:1,codingIndex:0,
  codingData:[{challenge_code:'A'},{challenge_code:'B'}],codingSubmitted:new Set(),
  document:{getElementById:node},fetch:()=>new Promise(resolve=>replies.push(resolve))});
 vm.runInContext(section('function loadCoding()','function runSampleCode()'),context);
 context.loadCoding();context.codingIndex=1;context.loadCoding();
 replies[1]({ok:true,json:async()=>({code:''})});await tick();
 assert.equal(node('c-editor').value,'');
 replies[0]({ok:true,json:async()=>({code:'stale answer A'})});await tick();
 assert.equal(node('c-editor').value,'');
 assert.equal(node('c-editor').disabled,false);
});

test('MCQ-only exams unlock Finish only after coding list loads successfully',()=>{
 const button={style:{}};
 const context=vm.createContext({sessionId:1,mcqFinished:true,codingLoaded:false,codingData:[],codingSubmitted:new Set(),document:{getElementById:()=>button}});
 vm.runInContext(section('function checkFinishStatus()','async function finishAssessment'),context);
 context.checkFinishStatus();assert.equal(button.style.pointerEvents,'none');
 context.codingLoaded=true;context.checkFinishStatus();assert.equal(button.style.pointerEvents,'auto');
});
