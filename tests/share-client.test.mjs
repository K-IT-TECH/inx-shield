import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const source=(await readFile(new URL('../src/share.js',import.meta.url),'utf8')).replace('export function','function');
function client({id='test-id',controller=true,unsupported=false,registrationError=false}={}){
  const handlers={},requests=[],notices=[],messages=[],history=[],timers=[];
  const sw={controller:null,register:()=>registrationError?Promise.reject(Error('disabled')):Promise.resolve({}),addEventListener:(type,fn)=>{handlers[type]=fn;},removeEventListener:type=>{delete handlers[type];}};
  const active={postMessage:m=>requests.push(m)};if(controller)sw.controller=active;
  const context={URL,location:{href:'https://shield.example/?share='+id+'#checker'},history:{replaceState:(_a,_b,url)=>history.push(url)},navigator:unsupported?{}:{serviceWorker:sw},setTimeout:fn=>{timers.push(fn);return timers.length;},clearTimeout:()=>{},callbacks:{language:()=> 'en',onMessage:text=>messages.push(text),onNotice:text=>notices.push(text)}};
  vm.runInNewContext(source+'\nconnectSharing(callbacks);',context);
  return {sw,active,handlers,requests,notices,messages,history,timers};
}
test('Share query is removed before worker request and accepted once from current worker',()=>{
  const c=client();assert.deepEqual(c.history,['/#checker']);assert.equal(c.requests.length,1);
  c.handlers.message({source:{},data:{type:'SHARED_MESSAGE',text:'wrong sender'}});assert.equal(c.messages.length,0);
  c.handlers.message({source:c.active,data:{type:'SHARED_MESSAGE',text:'received'}});assert.deepEqual(c.messages,['received']);assert.equal(c.handlers.message,undefined);
});
test('A first-load controller change resumes delivery',()=>{
  const c=client({controller:false});assert.equal(c.requests.length,0);c.sw.controller=c.active;c.handlers.controllerchange();assert.equal(c.requests.length,1);
  c.handlers.message({source:c.active,data:{type:'SHARE_MISSING'}});assert.match(c.notices[0],/no longer available/);
});
test('Unsupported browsers and too-long shares show a clear fallback without requesting data',()=>{
  const c=client({unsupported:true});assert.match(c.notices[0],/not ready/);assert.equal(c.requests.length,0);
  const d=client({id:'too-long'});assert.match(d.notices[0],/no partial check/);assert.equal(d.requests.length,0);
});
test('Worker startup failure and timeout do not leave a silent waiting state',async()=>{
  const c=client({controller:false,registrationError:true});await new Promise(resolve=>setImmediate(resolve));assert.match(c.notices[0],/not ready/);
  const d=client({controller:false});d.timers[0]();assert.match(d.notices[0],/not ready/);assert.equal(d.handlers.controllerchange,undefined);
});
