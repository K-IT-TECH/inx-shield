import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {captureMessage} from '../extension/capture.js';
import {checkCapture} from '../extension/check-capture.js';
import {analyze} from '../src/detector.js';

const anchor=(href,label,hidden=false)=>({href,innerText:label,textContent:label,hidden,getBoundingClientRect:()=>({height:hidden?0:20})});
const body=(text,links=[],hidden=false)=>({innerText:text,hidden,getBoundingClientRect:()=>({height:hidden?0:60}),querySelectorAll:()=>links});
function capture({text='',links=[],bodies=[],hostname='mail.google.com',parentLink=null}={}){
  const root={nodeType:1,querySelectorAll:()=>links,closest:()=>parentLink};
  const range={commonAncestorContainer:root,intersectsNode:el=>links.includes(el)||el===parentLink};
  const context={URL,location:{hostname},window:{getSelection:()=>({toString:()=>text,rangeCount:text?1:0,getRangeAt:()=>range})},document:{querySelectorAll:()=>bodies},getComputedStyle:el=>({display:el.hidden?'none':'block',visibility:'visible'})};
  // Exercise Chrome's copied-function execution, with no module scope available.
  return JSON.parse(JSON.stringify(vm.runInNewContext('('+captureMessage.toString()+')()',context)));
}
test('Capture includes destinations behind link labels, strips private URL parts, and flags mismatch',()=>{
  const data=capture({bodies:[body('Please review your account details.',[anchor('https://attacker.example/private?token=do-not-copy#secret','https://bank.example')])]});
  assert.equal(data.links[0].href,'https://attacker.example');
  assert.equal(data.links[0].shownHost,'bank.example');
  assert.equal(data.links[0].mismatch,true);
  assert.equal(checkCapture(data.text,data).verdict,'caution');
  assert.ok(!JSON.stringify(data).includes('do-not-copy'));
});
test('Selection wins over other Gmail messages and captures an enclosing anchor',()=>{
  const link=anchor('https://bit.ly/example','Check details');
  const data=capture({text:'Check details',parentLink:link,bodies:[body('other private email'),body('another private email')]});
  assert.equal(data.kind,'selection');assert.equal(data.text,'Check details');assert.equal(data.links.length,1);
  assert.ok(checkCapture(data.text,data).reasons.includes('short_link'));
});
test('Multiple expanded emails require deliberate selection instead of guessing the last message',()=>{
  assert.equal(capture({bodies:[body('first email text'),body('second email text')]}).error,'multiple_messages');
});
test('Hidden email bodies and non-web targets are excluded',()=>{
  const data=capture({bodies:[body('hidden old email',[],true),body('Message with contact links',[anchor('mailto:private@example.com','Mail'),anchor('javascript:alert(1)','Click'),anchor('https://hidden.example','Hidden',true)])]});
  assert.deepEqual(data.links,[]);assert.equal(data.text,'Message with contact links');
});
test('Unselected non-Gmail pages are not read',()=>assert.equal(capture({hostname:'example.com',bodies:[body('Private other page')]}).error,'no_message'));
test('Oversized captured messages are rejected without returning partial text',()=>assert.deepEqual(capture({text:'a'.repeat(12001)}),{error:'too_long'}));
test('Too many captured links are rejected without a partial verdict',()=>{
  assert.equal(capture({text:'A message with several links',links:Array.from({length:21},(_,i)=>anchor(`https://site${i}.example`,'More'))}).error,'too_many_links');
});
test('Matching displayed address does not create a mismatch warning',()=>{
  const data=capture({text:'Read the school newsletter.',links:[anchor('https://www.school.example/news?ref=123','https://school.example')]});
  assert.equal(data.links[0].mismatch,false);assert.equal(checkCapture(data.text,data).verdict,'low');
});
test('Credential-in-URL signal survives without returning credentials',()=>{
  const data=capture({text:'Read these account details.',links:[anchor('https://private-user:secret-password@attacker.example/path','Open') ]});
  assert.ok(!JSON.stringify(data).includes('private-user'));assert.ok(!JSON.stringify(data).includes('secret-password'));
  assert.ok(checkCapture(data.text,data).reasons.includes('unusual_link'));
});
test('Short button labels still evaluate captured destinations',()=>{
  const data=capture({text:'Open',links:[anchor('https://bank.example@attacker.example/','Open')]});
  assert.equal(checkCapture(data.text,data).verdict,'caution');
});
test('Capture-assisted and pasted checks keep scam detection and enforce bounds',()=>{
  assert.equal(checkCapture('Please share your OTP to verify.',null).verdict,'scam');
  assert.throws(()=>analyze('Review this message',{links:Array(21).fill('https://a.example')}),TypeError);
  assert.throws(()=>analyze('Review this message',{links:[null]}),TypeError);
});
