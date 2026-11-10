import { createClient } from '@supabase/supabase-js';
import { analyze, REASONS, ENGINE_VERSION } from './detector.js';
import { ta, labels, descriptions, actions, samples } from './i18n.js';
import { SUPABASE_URL, SUPABASE_KEY } from './config.js';
import { renderEvidence } from './evidence.js';
import { connectFeedback } from './feedback.js';
import { connectSharing } from './share.js';
import { createHistoryStore, filterHistory, normalizeHistory, HISTORY_KEY } from './history.js';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
let lang='en', result=null, toastTimer, installPrompt, account=null, cloudRows=[];
try { if(localStorage.getItem('inx-shield-language')==='ta')lang='ta'; } catch { /* Language still works without storage. */ }
const t=(en,ta)=>lang==='ta'?ta:en, pick=a=>a[lang==='ta'?1:0];
const feedback=connectFeedback({getContext:()=>result?{result,text:$('#message').value,source:$('#source').value}:null,language:()=>lang});
const original=new Map($$('[data-i18n]').map(el=>[el,el.innerHTML]));
const toast=text=>{ $('#toast').textContent=text; clearTimeout(toastTimer); toastTimer=setTimeout(()=>$('#toast').textContent='',6500); };
let supabase;
try { supabase=createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{storage:sessionStorage,persistSession:true,detectSessionInUrl:false}}); } catch { /* Local checks work even if storage is disabled. */ }
const historyStore=createHistoryStore(()=>localStorage);
const readHistory=()=>historyStore.read();
function writeHistory(rows){
  if(historyStore.write(rows))return true;
  toast(t('Your browser could not save this change. Check storage permissions.','உங்கள் browser-ல் இந்த மாற்றத்தைச் சேமிக்க முடியவில்லை. Storage permission-ஐச் சரிபாருங்கள்.'));
  return false;
}
function summary(){return {id:globalThis.crypto?.randomUUID?.() || 'check-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2),source:$('#source').value,verdict:result.verdict,reason_codes:result.reasons,engine_version:ENGINE_VERSION,created_at:new Date().toISOString()};}
function historyRow(row,cloud=false){
  const item=document.createElement('details');
  item.className='history-row';
  item.dataset.historyId=row.id;
  const heading=document.createElement('summary');
  const text=document.createElement('span');
  text.className='history-heading';
  const title=document.createElement('strong');
  title.textContent=pick(labels[row.verdict]);
  const dot=document.createElement('span');
  dot.className='history-dot '+row.verdict;
  dot.setAttribute('aria-hidden','true');
  title.prepend(dot);
  const date=new Date(row.created_at).toLocaleString(lang==='ta'?'ta-IN':'en-IN',{dateStyle:'medium',timeStyle:'short'});
  const detail=document.createElement('span');
  detail.className='history-meta';
  const source=row.source==='other'?t('Other','மற்றவை'):row.source==='whatsapp'?'WhatsApp':row.source.toUpperCase();
  detail.textContent=`${source} · ${date}`;
  text.append(title,detail);
  const badge=document.createElement('span');
  badge.className='history-badge';
  badge.textContent=cloud?t('Private cloud','தனிப்பட்ட cloud'):t('On this device','இந்த சாதனத்தில்');
  heading.append(text,badge);
  const body=document.createElement('div');
  body.className='history-detail';
  const description=document.createElement('p');
  description.textContent=pick(descriptions[row.verdict]);
  const why=document.createElement('h4');
  why.textContent=t('What we noticed then','அப்போது கவனித்தவை');
  const reasons=document.createElement('ul');
  reasons.className='reason-list';
  const reasonText=row.verdict==='unclear'
    ?[t('The message did not contain enough context.','Message-ல் போதுமான தகவல் இல்லை.')]
    :row.reason_codes.length?row.reason_codes.map(code=>pick(REASONS[code]))
    :[t('No supported warning patterns were found.','ஆதரிக்கப்படும் எச்சரிக்கை அறிகுறிகள் தெரியவில்லை.')];
  for(const reason of reasonText){const li=document.createElement('li');li.textContent=reason;reasons.append(li);}
  const next=document.createElement('div');
  next.className='next-step';
  const nextTitle=document.createElement('h4');
  nextTitle.textContent=t('What you can do','நீங்கள் செய்யக்கூடியது');
  const advice=document.createElement('p');
  advice.textContent=pick(actions[row.verdict]);
  next.append(nextTitle,advice);
  const note=document.createElement('p');
  note.className='fine';
  note.textContent=t('Saved guidance, not a new check. The original message and link addresses were not saved.','இது சேமித்த வழிகாட்டி; புதிய சோதனை அல்ல. Original message மற்றும் link முகவரிகள் சேமிக்கப்படவில்லை.');
  const button=document.createElement('button');
  button.type='button';
  button.className='text-button history-delete';
  button.textContent=t('Delete this check','இந்தச் சோதனையை நீக்கு');
  button.setAttribute('aria-label',t('Delete saved check: ','சேமித்த சோதனையை நீக்கு: ')+pick(labels[row.verdict])+' · '+date);
  button.addEventListener('click',async()=>{
    button.disabled=true;
    try{
      if(cloud){
        const {error}=await supabase.from('scan_summaries').delete().eq('id',row.id);
        if(error)throw error;
        await loadCloud();
        $('#refresh-cloud').focus();
      }else{
        if(!writeHistory(readHistory().filter(saved=>saved.id!==row.id)))return;
        renderHistory();
        $('#history-count').focus({preventScroll:true});
      }
      toast(t('Saved check deleted.','சேமித்த சோதனை நீக்கப்பட்டது.'));
    }catch{toast(t('Could not delete the cloud result. Try again.','Cloud முடிவை நீக்க முடியவில்லை. மீண்டும் முயற்சியுங்கள்.'));}
    finally{button.disabled=false;}
  });
  body.append(description,why,reasons,next,note,button);
  item.append(heading,body);
  return item;
}
function renderHistory(){
  const box=$('#history-list');
  const openIds=new Set([...box.querySelectorAll('details[open]')].map(el=>el.dataset.historyId));
  const rows=readHistory();
  const filters={verdict:$('#history-verdict').value,source:$('#history-source').value};
  const visible=filterHistory(rows,filters);
  box.replaceChildren();
  if(!visible.length){
    const p=document.createElement('p');p.className='history-empty';
    p.textContent=rows.length
      ?t('No saved checks match these filters. Try another result or source.','இந்த filters-க்கு ஏற்ற சோதனைகள் இல்லை. வேறு முடிவு அல்லது இடத்தைத் தேர்வு செய்யுங்கள்.')
      :t('No saved checks yet. Save a result after checking a message.','இன்னும் முடிவுகள் சேமிக்கப்படவில்லை. Message-ஐச் சோதித்த பின் சேமிக்கலாம்.');
    box.append(p);
  }else for(const row of visible){const item=historyRow(row);item.open=openIds.has(row.id);box.append(item);}
  $('#history-count').textContent=t(`Showing ${visible.length} of ${rows.length} saved checks`,`${rows.length} சேமித்த சோதனைகளில் ${visible.length} காட்டப்படுகின்றன`);
  $('#history-verdict').disabled=!rows.length;
  $('#history-source').disabled=!rows.length;
  $('#reset-history-filters').disabled=!filters.verdict&&!filters.source;
  $('#export-history').disabled=!rows.length;
  $('#clear-history').disabled=!rows.length;
}
function resetHistoryFilters(){
  $('#history-verdict').value='';$('#history-source').value='';
  renderHistory();
}
$('#history-verdict').addEventListener('change',renderHistory);
$('#history-source').addEventListener('change',renderHistory);
$('#reset-history-filters').addEventListener('click',resetHistoryFilters);
window.addEventListener('storage',event=>{if(event.key===HISTORY_KEY||event.key===null)renderHistory();});
function renderHighlights(){
  const evidence=result.evidence||[];
  $('#evidence-details').hidden=!evidence.length;
  $('#evidence-title').textContent=t('See highlighted phrases','குறிப்பிட்ட சொற்களைப் பாருங்கள்');
  $('#evidence-note').textContent=t('Tap a highlight to see why it was noticed. These are clues, not proof. This text is not saved.','குறிப்பிட்ட சொற்களைத் தொட்டு காரணத்தைப் பாருங்கள். இவை அறிகுறிகள் மட்டுமே; ஆதாரம் அல்ல. இந்த text சேமிக்கப்படாது.');
  renderEvidence($('#evidence-text'),$('#evidence-explanation'),$('#message').value,evidence,lang);
}
function renderResult(){if(!result)return;renderHighlights();$('#result-empty').hidden=true;$('#result-content').hidden=false;$('#verdict-box').className='verdict '+result.verdict;$('#verdict-kicker').textContent=t('Your message check','உங்கள் message சோதனை');$('#verdict-title').textContent=pick(labels[result.verdict]);$('#verdict-copy').textContent=pick(descriptions[result.verdict]);$('#next-copy').textContent=pick(actions[result.verdict]);$('#reasons').replaceChildren();const reasons=result.reasons.length?result.reasons.map(k=>pick(REASONS[k])):[t('No supported warning patterns found in this text.','இந்த text-ல் ஆதரிக்கப்படும் எச்சரிக்கை அறிகுறிகள் தெரியவில்லை.')];if(result.verdict==='unclear')reasons.splice(0,reasons.length,t('The message is too short to give useful context.','போதுமான தகவல் பெற message மிகவும் குறுகியதாக உள்ளது.'));for(const reason of reasons){const li=document.createElement('li');li.textContent=reason;$('#reasons').append(li);}$('#link-details').hidden=!result.links.length;$('#link-list').replaceChildren();for(const host of result.links){const li=document.createElement('li');li.textContent=host;$('#link-list').append(li);}$('#save-cloud').disabled=false;}
function resetResult(){feedback.reset();$('#evidence-text').replaceChildren();$('#evidence-explanation').textContent='';$('#evidence-details').hidden=true;$('#evidence-details').open=false;result=null;$('#result-empty').hidden=false;$('#result-content').hidden=true;$('#input-error').textContent='';$('#save-cloud').disabled=true;if('speechSynthesis'in window)speechSynthesis.cancel();}
function updateCount(){$('#char-count').textContent=`${$('#message').value.length.toLocaleString()} / 12,000`;}
function setLanguage(value){lang=value;$('#language').value=value;try{localStorage.setItem('inx-shield-language',value);}catch{}document.documentElement.lang=value;$('.history-filters').setAttribute('aria-label',t('Filter device history','சாதன history-ஐ filter செய்'));for(const [el,en] of original){if(lang==='ta')el.textContent=ta[el.dataset.i18n]||el.textContent;else el.innerHTML=en;}$('#message').placeholder=t('Paste a message you’re unsure about…','சந்தேகமான message-ஐ இங்கே paste செய்யுங்கள்…');feedback.translate();renderResult();renderHistory();renderCloud();if('speechSynthesis'in window)speechSynthesis.cancel();}
$('#language').addEventListener('change',e=>setLanguage(e.target.value));
$('#message').addEventListener('input',()=>{updateCount();resetResult();});$('#source').addEventListener('change',resetResult);
$('#clear').addEventListener('click',()=>{$('#message').value='';resetResult();updateCount();$('#message').focus();});
$('#analyze').addEventListener('click',()=>{
  resetResult();
  if(!$('#message').value.trim()){
    $('#input-error').textContent=t('Paste a message first, or choose an example.','முதலில் message-ஐ paste செய்யுங்கள் அல்லது உதாரணத்தைத் தேர்வு செய்யுங்கள்.');
    $('#message').focus();return;
  }
  try{
    result=analyze($('#message').value,{includeEvidence:true});renderResult();
    $('#result-panel').focus({preventScroll:true});
    if(innerWidth<681)$('#result-panel').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
  }catch(error){
    resetResult();
    $('#input-error').textContent=error instanceof RangeError
      ?t('Please keep the message within 12,000 characters.','Message 12,000 எழுத்துகளுக்குள் இருக்க வேண்டும்.')
      :t('This check could not finish. Refresh the page and try again. No result was saved.','இந்தச் சோதனையை முடிக்க முடியவில்லை. பக்கத்தை refresh செய்து மீண்டும் முயற்சியுங்கள். முடிவு சேமிக்கப்படவில்லை.');
  }
});
$$('[data-sample]').forEach(button=>button.addEventListener('click',()=>{$('#message').value=pick(samples[button.dataset.sample]);resetResult();updateCount();$('#message').focus();}));
$('#save-local').addEventListener('click',()=>{if(!result)return;if(writeHistory([summary(),...readHistory()].slice(0,100))){resetHistoryFilters();toast(t('Result saved on this device. The message was not saved.','முடிவு இந்த சாதனத்தில் சேமிக்கப்பட்டது. Message சேமிக்கப்படவில்லை.'));}});
$('#clear-history').addEventListener('click',()=>{if(confirm(t('Delete all result summaries saved on this device?','இந்த சாதனத்தில் சேமித்த அனைத்து முடிவுகளையும் நீக்கவா?'))&&writeHistory([])){resetHistoryFilters();toast(t('Device history deleted.','சாதன history நீக்கப்பட்டது.'));}});
$('#export-history').addEventListener('click',()=>{const blob=new Blob([JSON.stringify({app:'INX Shield',exported_at:new Date().toISOString(),results:readHistory()},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='inx-shield-results.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
$('#read-aloud').addEventListener('click',()=>{if(!result)return;if(!('speechSynthesis'in window)){toast(t('Read aloud is not supported by this browser.','இந்த browser-ல் வாசிக்கும் வசதி இல்லை.'));return;}speechSynthesis.cancel();const speech=new SpeechSynthesisUtterance([pick(labels[result.verdict]),pick(descriptions[result.verdict]),pick(actions[result.verdict])].join('. '));speech.lang=lang==='ta'?'ta-IN':'en-IN';speech.onerror=()=>toast(t('A suitable voice is unavailable on this device.','இந்த சாதனத்தில் தேவையான குரல் இல்லை.'));speechSynthesis.speak(speech);});
function renderCloud(){const openIds=new Set([...$('#cloud-list').querySelectorAll('details[open]')].map(el=>el.dataset.historyId));$('#auth-form').hidden=!!account;$('#cloud-actions').hidden=!account;$('#account-label').textContent=account?t('Signed in: ','Sign in: ')+(account.email||''):'';$('#save-cloud').disabled=!result;$('#cloud-list').replaceChildren();if(account){if(!cloudRows.length){const p=document.createElement('p');p.className='fine';p.textContent=t('No cloud results yet.','Cloud முடிவுகள் இன்னும் இல்லை.');$('#cloud-list').append(p);}else cloudRows.forEach(r=>{const item=historyRow(r,true);item.open=openIds.has(r.id);$('#cloud-list').append(item);});}}
async function loadCloud(){if(!account||!supabase)return;const {data,error}=await supabase.from('scan_summaries').select('id,created_at,source,verdict,reason_codes,engine_version').order('created_at',{ascending:false}).limit(100);if(error)throw error;cloudRows=normalizeHistory(data);renderCloud();}
$('#auth-form').addEventListener('submit',async e=>{e.preventDefault();if(!supabase){$('#cloud-status').textContent=t('Cloud sign-in is unavailable in this browser. Device checks still work.','இந்த browser-ல் cloud sign-in கிடைக்கவில்லை. Device சோதனை வேலை செய்யும்.');return;}const button=e.submitter;button.disabled=true;$('#cloud-status').textContent=t('Signing in…','Sign in செய்கிறது…');try{const {data,error}=await supabase.auth.signInWithPassword({email:$('#email').value.trim(),password:$('#password').value});if(error)throw error;account=data.user;$('#password').value='';await loadCloud();$('#cloud-status').textContent=t('Private cloud history connected. Nothing saves automatically.','Private cloud history இணைந்துள்ளது. எதுவும் தானாகச் சேமிக்காது.');}catch{$('#cloud-status').textContent=t('Could not sign in. Check your pilot account details or connection. Public registration is not open yet.','Sign in செய்ய முடியவில்லை. Pilot account தகவல் அல்லது இணையத்தைச் சரிபாருங்கள். Public registration இன்னும் தொடங்கவில்லை.');}finally{button.disabled=false;renderCloud();}});
$('#save-cloud').addEventListener('click',async()=>{if(!account||!result)return;const button=$('#save-cloud');button.disabled=true;try{const s=summary();const {error}=await supabase.from('scan_summaries').insert({source:s.source,verdict:s.verdict,reason_codes:s.reason_codes,engine_version:s.engine_version});if(error)throw error;await loadCloud();toast(t('Summary saved privately to cloud. Message not uploaded.','முடிவு மட்டும் cloud-ல் சேமிக்கப்பட்டது. Message upload ஆகவில்லை.'));}catch{toast(t('Cloud save failed. You can still save on this device.','Cloud-ல் சேமிக்க முடியவில்லை. இந்த சாதனத்தில் சேமிக்கலாம்.'));}finally{button.disabled=false;}});
$('#refresh-cloud').addEventListener('click',async()=>{try{await loadCloud();toast(t('Cloud history refreshed.','Cloud history புதுப்பிக்கப்பட்டது.'));}catch{toast(t('Could not load cloud history. Check your connection.','Cloud history பெற முடியவில்லை. இணையத்தைச் சரிபாருங்கள்.'));}});
$('#sign-out').addEventListener('click',async()=>{const {error}=await supabase.auth.signOut({scope:'local'});if(error){toast(t('Could not sign out. Please retry.','Sign out செய்ய முடியவில்லை. மீண்டும் முயற்சியுங்கள்.'));return;}account=null;cloudRows=[];renderCloud();$('#cloud-status').textContent=t('Signed out on this device.','இந்த சாதனத்தில் sign out செய்யப்பட்டது.');});
if(supabase){supabase.auth.getSession().then(async({data})=>{account=data.session?.user||null;renderCloud();if(account)try{await loadCloud();}catch{ $('#cloud-status').textContent=t('Cloud history could not be loaded. Retry when online.','Cloud history பெற முடியவில்லை. இணையம் வந்ததும் முயற்சியுங்கள்.');}}).catch(()=>{});supabase.auth.onAuthStateChange((_event,session)=>{account=session?.user||null;if(!account)cloudRows=[];renderCloud();});}
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installPrompt=event;});$('#install').addEventListener('click',async()=>{if(installPrompt){await installPrompt.prompt();installPrompt=null;}else $('#install-dialog').showModal();});$('#close-install').addEventListener('click',()=>$('#install-dialog').close());
connectSharing({
  language:()=>lang,
  onNotice:message=>{$('#share-status').textContent=message;toast(message);},
  onMessage:text=>{
    $('#message').value=text;resetResult();updateCount();
    toast(t('Shared text is ready. Review it, remove secrets, then tap Check.','Share செய்த text தயாராக உள்ளது. ரகசிய எண்களை நீக்கிவிட்டு சரிபார் அழுத்துங்கள்.'));
    $('#checker').scrollIntoView();$('#message').focus({preventScroll:true});
  }
});
$('#test-share').addEventListener('click',()=>{
  if(!('serviceWorker' in navigator)){
    $('#share-status').textContent=t('This browser cannot receive shared messages here. Open the live site in Chrome, or paste your message above.','இந்த browser-ல் இங்கே share செய்ய முடியவில்லை. Live site-ஐ Chrome-ல் திறக்கவும் அல்லது மேலே message-ஐ paste செய்யவும்.');
    return;
  }
  if(!navigator.serviceWorker?.controller){
    $('#share-status').textContent=t('Open or refresh this page once, then try again. Copy and paste is always available.','இந்தப் பக்கத்தை மீண்டும் திறந்து அல்லது refresh செய்து முயற்சியுங்கள். Copy–paste எப்போதும் பயன்படுத்தலாம்.');
    return;
  }
  if($('#message').value.trim()&&!confirm(t('Replace your current message with a harmless sample?','தற்போதைய message-க்கு பதிலாக ஒரு மாதிரி message-ஐ வைக்கவா?')))return;
  $('#share-test-text').value=t('INX Shield connection test. Hi, I will be home at 6. Shall we have dinner together?','INX Shield இணைப்பு சோதனை. வணக்கம், நான் மாலை 6 மணிக்கு வீட்டுக்கு வருகிறேன். சேர்ந்து சாப்பிடலாமா?');
  $('#share-test-form').submit();
});
setLanguage(lang);

