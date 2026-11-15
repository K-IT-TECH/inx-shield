import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {randomUUID} from 'node:crypto';
import {build} from 'esbuild';

const html=await readFile(new URL('../../public/index.html',import.meta.url),'utf8');
const {outputFiles}=await build({entryPoints:['src/app.js'],bundle:true,format:'iife',target:'es2022',write:false,plugins:[{
  name:'test-cloud-client',
  setup(build){
    build.onResolve({filter:/^@supabase\/supabase-js$/},()=>({path:'client',namespace:'test-cloud'}));
    build.onLoad({filter:/.*/,namespace:'test-cloud'},()=>({contents:'export const createClient = (...args) => globalThis.__createClient(...args);'}));
  }
}]});

// Execute the real application bundle and event handlers with a deterministic
// DOM/storage boundary. Browser QA separately covers layout and native controls.
export function webApp({client=null,storageBlocked=false}={}){
  const elements=new Map(), events={}, values=new Map(), downloads=[], timers=new Map();let timerId=0;
  const element=tag=>({tagName:tag.toUpperCase(),value:'',textContent:'',innerHTML:'',hidden:false,disabled:false,open:false,checked:false,children:[],dataset:{},listeners:{},
    setAttribute(key,value){this[key]=value;},
    addEventListener(type,fn){(this.listeners[type]??=[]).push(fn);},
    async dispatch(type,event={}){for(const fn of this.listeners[type]||[])await fn(event);},
    showModal(){this.open=true;},close(){this.open=false;this.dispatch('close');},
    replaceChildren(...items){this.children=[...items];},append(...items){this.children.push(...items);},prepend(...items){this.children.unshift(...items);},
    querySelectorAll(selector){return selector==='details[open]'?this.children.filter(el=>el.tagName==='DETAILS'&&el.open):[];},
    focus(){},scrollIntoView(){},click(){if(this.tagName==='A')downloads.push({href:this.href,name:this.download});else return this.dispatch('click');}
  });
  for(const match of html.matchAll(/<([a-z][\w-]*)\b([^>]*\bid="([^"]+)"[^>]*)>/giu)){
    const node=element(match[1]);node.hidden=/\shidden(?:\s|$)/u.test(match[2]);node.disabled=/\sdisabled(?:\s|$)/u.test(match[2]);elements.set('#'+match[3],node);
  }
  elements.set('.history-filters',element('div'));
  const samples=[...html.matchAll(/data-sample="([^"]+)"/gu)].map(match=>{const node=element('button');node.dataset.sample=match[1];return node;});
  const get=id=>{if(!elements.has(id))throw Error('Unknown fixture element: '+id);return elements.get(id);};
  get('#source').value='sms';get('#language').value='en';
  const storage={getItem:key=>{if(storageBlocked)throw Error('Storage blocked');return values.get(key)??null;},setItem:(key,value)=>{if(storageBlocked)throw Error('Storage blocked');values.set(key,value);}};
  const blobs=new Map();let blobId=0;
  class TestURL extends URL{static createObjectURL(blob){const id='blob:test-'+(++blobId);blobs.set(id,blob);return id;}static revokeObjectURL(){}}
  const context={URL:TestURL,Blob,console,crypto:{randomUUID},setTimeout:(fn,delay)=>{const id=++timerId;if(delay===0)timers.set(id,fn);return id;},clearTimeout:id=>timers.delete(id),innerWidth:1024,location:{href:'https://qa.invalid/'},navigator:{clipboard:{writeText:async()=>{}}},localStorage:storage,sessionStorage:storage,confirm:()=>true,
    document:{documentElement:{lang:'en'},querySelector:get,getElementById:id=>get('#'+id),querySelectorAll:selector=>selector==='[data-sample]'?samples:[],createElement:element},
    window:{addEventListener:(type,fn)=>{events[type]=fn;}},
    __createClient:()=>{if(!client)throw Error('Cloud unavailable');return client;}
  };
  vm.runInNewContext(outputFiles[0].text,context);
  return {get,values,downloads,blobs,events,context,
    async flushAuthTimers(){const pending=[...timers.values()];timers.clear();await Promise.all(pending.map(fn=>fn()));},
    click:id=>get(id).dispatch('click'),
    input:async(id,value)=>{get(id).value=value;await get(id).dispatch('input');},
    change:async(id,value)=>{get(id).value=value;await get(id).dispatch('change',{target:get(id)});}
  };
}
