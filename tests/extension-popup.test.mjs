import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {build} from 'esbuild';
const {outputFiles}=await build({entryPoints:['extension/popup-source.js'],bundle:true,minify:true,format:'iife',target:'es2022',write:false});
const bundle=outputFiles[0].text;
function popup(){
  const elements=new Map();
  const element=()=>({value:'',textContent:'',hidden:true,children:[],listeners:{},addEventListener(type,fn){this.listeners[type]=fn;},replaceChildren(){this.children=[];},append(child){this.children.push(child);},focus(){}});
  const get=id=>{if(!elements.has(id))elements.set(id,element());return elements.get(id);};
  let calls=0, restricted=false;
  const link={href:'https://attacker.example/private?token=secret',innerText:'https://bank.example',getBoundingClientRect:()=>({height:20})};
  const body={innerText:'Please review the school newsletter.',querySelectorAll:()=>[link],getBoundingClientRect:()=>({height:60})};
  const captureContext={URL,location:{hostname:'mail.google.com'},window:{getSelection:()=>({toString:()=>''})},document:{querySelectorAll:()=>[body]},getComputedStyle:()=>({display:'block',visibility:'visible'})};
  const context={URL,document:{documentElement:{lang:'en'},querySelector:get,createElement:element},chrome:{tabs:{query:async()=>[{id:5}]},scripting:{executeScript:async({target,func})=>{calls++;assert.equal(target.tabId,5);if(restricted)throw Error('restricted page');return [{result:vm.runInNewContext('('+func.toString()+')()',captureContext)}];}}}};
  vm.runInNewContext(bundle,context);
  return {get,click:async id=>get(id).listeners.click(),calls:()=>calls,restrict:()=>{restricted=true;}};
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
