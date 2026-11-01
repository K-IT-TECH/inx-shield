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
