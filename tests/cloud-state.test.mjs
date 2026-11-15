import test from 'node:test';
import assert from 'node:assert/strict';
import {webApp} from './helpers/web-app.mjs';

const tick=()=>new Promise(setImmediate);
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
const userA={id:'user-a',email:'a@example.test'},userB={id:'user-b',email:'b@example.test'};
const row=(id,verdict='scam')=>({id,source:'sms',verdict,reason_codes:verdict==='scam'?['credentials']:[],engine_version:'rules-1.4.0',created_at:'2026-11-14T12:00:00Z'});
const aRow=row('11111111-1111-4111-8111-111111111111');
const bRow=row('22222222-2222-4222-8222-222222222222','low');
function cloud({initial=Promise.resolve({data:{session:null}}),signOut=async()=>({error:null})}={}){
  let listener;const reads=[];
  const client={auth:{getSession:()=>initial,onAuthStateChange:fn=>{listener=fn;return {data:{subscription:{unsubscribe(){}}}};},signOut},from:()=>({select:()=>({order:()=>({limit:()=>{const request=deferred();reads.push(request);return request.promise;}})})})};
  return {client,reads,emit:(event,user)=>listener(event,user?{user}:null)};
}
const rows=app=>app.get('#cloud-list').children.filter(el=>el.tagName==='DETAILS');

test('A history response arriving after sign-out cannot appear for the next account',async()=>{
  const c=cloud(),app=webApp({client:c.client});await tick();c.emit('SIGNED_IN',userA);
  const pending=app.click('#refresh-cloud');c.emit('SIGNED_OUT',null);
  c.reads[0].resolve({data:[aRow],error:null});await pending;c.emit('SIGNED_IN',userB);
  assert.equal(rows(app).length,0);
});
test('Switching accounts clears previously rendered cloud rows immediately',async()=>{
  const c=cloud(),app=webApp({client:c.client});await tick();c.emit('SIGNED_IN',userA);
  const pending=app.click('#refresh-cloud');c.reads[0].resolve({data:[aRow],error:null});await pending;
  assert.equal(rows(app).length,1);c.emit('SIGNED_IN',userB);assert.equal(rows(app).length,0);
});
test('Out-of-order refresh responses keep the newest requested cloud history',async()=>{
  const c=cloud(),app=webApp({client:c.client});await tick();c.emit('SIGNED_IN',userA);
  const older=app.click('#refresh-cloud'),newer=app.click('#refresh-cloud');
  c.reads[1].resolve({data:[bRow],error:null});await newer;
  c.reads[0].resolve({data:[aRow],error:null});await older;
  assert.equal(rows(app)[0].dataset.historyId,bRow.id);
});
test('A delayed initial session cannot restore a user after a newer sign-out event',async()=>{
  const initial=deferred(),c=cloud({initial:initial.promise}),app=webApp({client:c.client});
  c.emit('SIGNED_OUT',null);initial.resolve({data:{session:{user:userA}}});await tick();
  assert.equal(app.get('#auth-form').hidden,false);assert.equal(app.get('#cloud-actions').hidden,true);
  assert.equal(c.reads.length,0);
});
test('Sign-out network failures show a recoverable message instead of rejecting the UI action',async()=>{
  const c=cloud({signOut:async()=>{throw Error('Network unavailable');}}),app=webApp({client:c.client});await tick();c.emit('SIGNED_IN',userA);
  await assert.doesNotReject(app.click('#sign-out'));
  assert.match(app.get('#toast').textContent,/Could not sign out/);
  assert.equal(app.get('#cloud-actions').hidden,false);
});

test('Initial auth events fetch history outside the synchronous auth callback',async()=>{
  const c=cloud(),app=webApp({client:c.client});await tick();c.emit('INITIAL_SESSION',userA);
  assert.equal(c.reads.length,0);const pending=app.flushAuthTimers();assert.equal(c.reads.length,1);
  c.reads[0].resolve({data:[aRow],error:null});await pending;assert.equal(rows(app).length,1);
});
test('Signing out and back into the same account still invalidates its earlier read',async()=>{
  const c=cloud(),app=webApp({client:c.client});await tick();c.emit('SIGNED_IN',userA);
  const pending=app.click('#refresh-cloud');c.emit('SIGNED_OUT',null);c.emit('SIGNED_IN',userA);
  c.reads[0].resolve({data:[aRow],error:null});await pending;assert.equal(rows(app).length,0);
});
test('An obsolete rejected refresh cannot show an error over newer results',async()=>{
  const c=cloud(),app=webApp({client:c.client});await tick();c.emit('SIGNED_IN',userA);
  const older=app.click('#refresh-cloud'),newer=app.click('#refresh-cloud');
  c.reads[1].resolve({data:[bRow],error:null});await newer;
  c.reads[0].reject(Error('Old request failed'));await older;
  assert.equal(rows(app)[0].dataset.historyId,bRow.id);assert.equal(app.get('#toast').textContent,'Cloud history refreshed.');
});
test('A successful sign-in with a failed history read reports the real recoverable state',async()=>{
  const c=cloud();c.client.auth.signInWithPassword=async()=>{c.emit('SIGNED_IN',userA);return {data:{user:userA},error:null};};
  const app=webApp({client:c.client});await tick();const button={disabled:false};
  const pending=app.get('#auth-form').dispatch('submit',{preventDefault(){},submitter:button});await tick();
  c.reads[0].resolve({data:null,error:Error('Offline')});await pending;
  assert.equal(app.get('#cloud-actions').hidden,false);assert.match(app.get('#cloud-status').textContent,/Signed in, but cloud history/);assert.equal(button.disabled,false);
});
test('Changing language during a save cannot enable duplicate saves; editing cannot reenable a missing result',async()=>{
  const c=cloud(),insert=deferred();let writes=0;
  const originalFrom=c.client.from;c.client.from=()=>({...originalFrom(),insert:()=>{writes++;return insert.promise;}});
  const app=webApp({client:c.client});await tick();c.emit('SIGNED_IN',userA);
  await app.input('#message','Send your OTP to me.');await app.click('#analyze');const pending=app.click('#save-cloud');
  await app.change('#language','ta');assert.equal(app.get('#save-cloud').disabled,true);await app.click('#save-cloud');assert.equal(writes,1);
  await app.input('#message','A different message.');insert.resolve({error:null});await tick();
  c.reads[0].resolve({data:[aRow],error:null});await pending;assert.equal(app.get('#save-cloud').disabled,true);
});

test('Overlapping sign-in and auth-event history reads finish the signing-in status',async()=>{
  const c=cloud();c.client.auth.signInWithPassword=async()=>{c.emit('SIGNED_IN',userA);return {data:{user:userA},error:null};};
  const app=webApp({client:c.client});await tick();const button={disabled:false};
  const signIn=app.get('#auth-form').dispatch('submit',{preventDefault(){},submitter:button});await tick();
  const authRead=app.flushAuthTimers();assert.equal(c.reads.length,2);
  c.reads[1].resolve({data:[bRow],error:null});await authRead;
  c.reads[0].resolve({data:[aRow],error:null});await signIn;
  assert.equal(rows(app)[0].dataset.historyId,bRow.id);
  assert.match(app.get('#cloud-status').textContent,/Private cloud history connected/);
});
