'use strict';
async function runWithPiston(code,input='',transport=globalThis.fetch){
 if(typeof code!=='string'||code.length>20000||typeof input!=='string'||input.length>32000)
  return {error:true,type:'SERVICE_UNAVAILABLE',message:'Input exceeds allowed size'};
 const controller=new AbortController();
 const timeout=setTimeout(()=>controller.abort(),12000);
 try{
  const response=await transport('https://emacs.piston.rs/api/v2/execute',{
   method:'POST',signal:controller.signal,headers:{'Content-Type':'application/json'},
   body:JSON.stringify({language:'c',version:'*',files:[{content:code}],stdin:input,compile_timeout:10000,run_timeout:3000})
  });
  if(!response.ok)return {error:true,type:'SERVICE_UNAVAILABLE',message:'Code execution service unavailable'};
  const result=await response.json();
  if(result?.compile?.code!==undefined&&result.compile.code!==0)
   return {error:true,type:'COMPILE_ERROR',message:String(result.compile.output||'Compilation failed').slice(0,16000)};
  if(!result?.run||typeof result.run.stdout!=='string')
   return {error:true,type:'SERVICE_UNAVAILABLE',message:'Code execution service returned an invalid result'};
  if(result.run.code!==0)
   return {error:true,type:result.run.signal==='SIGKILL'?'TIME_LIMIT':'RUNTIME_ERROR',message:String(result.run.output||'Program failed').slice(0,16000)};
  return {error:false,stdout:result.run.stdout.slice(0,16000)};
 }catch(error){
  return {error:true,type:'SERVICE_UNAVAILABLE',message:'Code execution service unavailable'};
 }finally{
  clearTimeout(timeout);
 }
}
module.exports={runWithPiston};
