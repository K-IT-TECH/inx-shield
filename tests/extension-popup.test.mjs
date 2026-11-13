import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {build} from 'esbuild';
const {outputFiles}=await build({entryPoints:['extension/popup-source.js'],bundle:true,minify:true,format:'iife',target:'es2022',write:false});
const bundle=outputFiles[0].text;
function popup(){
  const elements=new Map();
  const element=()=>({value:'',textContent:'',hidden:true,open:false,checked:false,children:[],listeners:{},setAttribute(key,value){this[key]=value;},showModal(){this.open=true;},close(){this.open=false;this.listeners.close?.();},addEventListener(type,fn){this.listeners[type]=fn;},replaceChildren(){this.children=[];},append(child){this.children.push(child);},focus(){}});
  const get=id=>{if(!elements.has(id))elements.set(id,element());return elements.get(id);};
  let calls=0, restricted=false;
  const link={href:'https://attacker.example/private?token=secret',innerText:'https://bank.example',getBoundingClientRect:()=>({height:20})};
  const body={innerText:'Please review the school newsletter.',querySelectorAll:()=>[link],getBoundingClientRect:()=>({height:60})};
  const captureContext={URL,location:{hostname:'mail.google.com'},window:{getSelection:()=>({toString:()=>''})},document:{querySelectorAll:()=>[body]},getComputedStyle:()=>({display:'block',visibility:'visible'})};
  const copied=[];const context={URL,navigator:{clipboard:{writeText:async text=>{copied.push(text);}}},document:{documentElement:{lang:'en'},querySelector:get,getElementById:id=>get('#'+id),createElement:element},chrome:{tabs:{query:async()=>[{id:5}]},scripting:{executeScript:async({target,func})=>{calls++;assert.equal(target.tabId,5);if(restricted)throw Error('restricted page');return [{result:vm.runInNewContext('('+func.toString()+')()',captureContext)}];}}}};
  vm.runInNewContext(bundle,context);
  return {get,copied,click:async id=>get(id).listeners.click(),calls:()=>calls,restrict:()=>{restricted=true;}};
}
test('Bundled popup captures only after click, evaluates copied function and shows destination mismatch',async()=>{
  const p=popup();assert.equal(p.calls(),0);await p.click('#capture');assert.equal(p.calls(),1);
  assert.equal(p.get('#text').value,'Please review the school newsletter.');
  assert.equal(p.get('#links').hidden,false);assert.match(p.get('#link-list').children[0].textContent,/attacker\.example/);
  await p.click('#check');assert.match(p.get('#title').textContent,/Some warning signs/);
  assert.ok(p.get('#reasons').children.some(el=>el.textContent.includes('differs')));
});
test('Editing captured text clears hidden-link context and stale results',async()=>{
  const p=popup();await p.click('#capture');await p.click('#check');
  p.get('#text').value='Hi, I will be home at six for dinner.';p.get('#text').listeners.input();
  assert.equal(p.get('#links').hidden,true);assert.equal(p.get('#result').hidden,true);assert.match(p.get('#capture-status').textContent,/edited text only/);
  await p.click('#check');assert.match(p.get('#title').textContent,/No obvious warning/);
});
test('A failed new capture clears previous result and local email text with a translated fallback',async()=>{
  const p=popup();await p.click('#capture');await p.click('#check');p.restrict();await p.click('#capture');
  assert.equal(p.get('#text').value,'');assert.equal(p.get('#result').hidden,true);assert.equal(p.get('#links').hidden,true);assert.match(p.get('#error').textContent,/cannot be read/);
  p.get('#lang').value='ta';p.get('#lang').listeners.change();assert.match(p.get('#error').textContent,/படிக்க முடியவில்லை/);
});
test('Bundled extension gives a visible warning for short pasted requests in both languages',async()=>{
  const p=popup();p.get('#text').value='send OTP';await p.click('#check');
  assert.equal(p.get('#result').hidden,false);assert.match(p.get('#title').textContent,/Likely scam/);
  assert.equal(p.get('#error').textContent,'');
  p.get('#lang').value='ta';p.get('#lang').listeners.change();
  assert.match(p.get('#title').textContent,/மோசடியாக/);
});
test('Unexpected extension rendering failures clear stale output and show a retry message',async()=>{
  const p=popup();p.get('#text').value='send OTP';await p.click('#check');
  p.get('#reasons').append=()=>{throw new Error('render failure');};
  await p.click('#check');assert.equal(p.get('#result').hidden,true);
  assert.match(p.get('#error').textContent,/could not finish/);
  p.get('#lang').value='ta';assert.doesNotThrow(()=>p.get('#lang').listeners.change());
  assert.match(p.get('#error').textContent,/முடிக்க முடியவில்லை/);
});
test('Oversized extension input keeps its specific length error',async()=>{
  const p=popup();p.get('#text').value='a'.repeat(12001);await p.click('#check');
  assert.equal(p.get('#result').hidden,true);assert.match(p.get('#error').textContent,/over 12,000/);
});

test('Bundled feedback defaults to metadata, requires review, exports edits and clears on new input', async () => {
  const p=popup();p.get('#text').value='Unga OTP 123456 sollunga. Contact person@example.test';await p.click('#check');
  assert.ok(p.get('#evidence-text').children.some(child=>child.className==='evidence-mark'));
  await p.click('#feedback-open');assert.equal(p.get('#feedback-dialog').open,true);
  assert.equal(p.get('#feedback-include').checked,false);assert.equal(p.get('#feedback-copy').disabled,true);
  p.get('#feedback-type').value='false_alarm';p.get('#feedback-type').listeners.change();
  assert.doesNotMatch(p.get('#feedback-preview').value,/123456|person@example|reviewed_example/);
  await p.click('#feedback-copy');assert.equal(p.copied.length,1);
  p.get('#feedback-include').checked=true;p.get('#feedback-include').listeners.change();
  assert.doesNotMatch(p.get('#feedback-example').value,/123456|person@example/);
  assert.equal(p.get('#feedback-copy').disabled,true);
  p.get('#feedback-reviewed').checked=true;p.get('#feedback-reviewed').listeners.change();
  assert.equal(p.get('#feedback-copy').disabled,false);
  p.get('#feedback-example').value='Send OTP [NUMBER]';p.get('#feedback-example').listeners.input();
  assert.equal(p.get('#feedback-reviewed').checked,false);assert.equal(p.get('#feedback-copy').disabled,true);
  p.get('#feedback-reviewed').checked=true;p.get('#feedback-reviewed').listeners.change();
  await p.click('#feedback-copy');assert.match(p.copied.at(-1),/Send OTP \[NUMBER\]/);assert.doesNotMatch(p.copied.at(-1),/person@example|123456/);
  p.get('#text').value='A new message';p.get('#text').listeners.input();
  assert.equal(p.get('#feedback-dialog').open,false);assert.equal(p.get('#feedback-example').value,'');assert.equal(p.get('#feedback-preview').value,'');
  assert.equal(p.get('#evidence-text').children.length,0);
});
test('Highlight explanations and feedback controls switch to Tamil', async () => {
  const p=popup();p.get('#text').value='OTP kudunga';await p.click('#check');
  p.get('#lang').value='ta';p.get('#lang').listeners.change();
  const mark=p.get('#evidence-text').children.find(child=>child.className==='evidence-mark');
  mark.listeners.click();assert.match(p.get('#evidence-explanation').textContent,/ரகசிய/);
  await p.click('#feedback-open');assert.match(p.get('#feedback-title').textContent,/மேம்படுத்த/);
  await p.click('#feedback-close');assert.equal(p.get('#feedback-dialog').open,false);
});

test('Popup context adds advice without clearing a warning and survives language changes', async () => {
  const p=popup();p.get('#text').value='Job agent: pay a processing fee and send OTP.';await p.click('#check');
  assert.match(p.get('#category-list').children[0].children[0].textContent,/Job/);
  p.get('#context-expected').value='yes';p.get('#context-expected').listeners.change();
  p.get('#context-sender').value='known';p.get('#context-sender').listeners.change();
  p.get('#context-request').value='secret';p.get('#context-request').listeners.change();
  assert.match(p.get('#title').textContent,/Likely scam/);
  assert.match(p.get('#context-advice-title').textContent,/Pause/);
  assert.equal(p.get('#context-advice').hidden,false);
  p.get('#lang').value='ta';p.get('#lang').listeners.change();
  assert.equal(p.get('#context-request').value,'secret');
  assert.match(p.get('#context-advice-title').textContent,/நிறுத்துங்கள்/);
  assert.match(p.get('#category-list').children[0].children[0].textContent,/வேலை/);
  await p.click('#context-reset');assert.equal(p.get('#context-advice').hidden,true);
  assert.match(p.get('#title').textContent,/மோசடியாக/);
});
test('Popup message edits and new captures clear context, categories and feedback drafts', async () => {
  const p=popup();p.get('#text').value='Send your password.';await p.click('#check');
  p.get('#context-request').value='secret';p.get('#context-request').listeners.change();
  await p.click('#feedback-open');
  p.get('#text').value='New message';p.get('#text').listeners.input();
  assert.equal(p.get('#context-request').value,'unknown');
  assert.equal(p.get('#category-list').children.length,0);
  assert.equal(p.get('#context-advice').hidden,true);
  assert.equal(p.get('#feedback-dialog').open,false);
  await p.click('#check');p.get('#context-sender').value='unrecognized';p.get('#context-sender').listeners.change();
  await p.click('#capture');assert.equal(p.get('#context-sender').value,'unknown');
});
