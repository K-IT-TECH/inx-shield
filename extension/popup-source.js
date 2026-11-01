import {REASONS} from '../src/detector.js';
import {labels,descriptions,actions} from '../src/i18n.js';
import {captureMessage} from './capture.js';
import {checkCapture} from './check-capture.js';
const $=s=>document.querySelector(s);
let lang=0, last=null, captured=null, status='', error='';
const pick=a=>a[lang], pair=(en,ta)=>lang?ta:en;
const errors={
  no_message:['Select the message text first, or open one email in Gmail. You can also paste below.','Message text-ஐ தேர்வு செய்யுங்கள் அல்லது Gmail-ல் ஒரு email-ஐத் திறக்கவும். கீழே paste செய்யலாம்.'],
  multiple_messages:['More than one email is expanded. Select the exact message text you want to check.','ஒன்றுக்கு மேற்பட்ட email திறந்துள்ளது. சோதிக்க வேண்டிய message text-ஐத் தேர்வு செய்யுங்கள்.'],
  too_long:['This message is over 12,000 characters. Select a shorter section; no partial check was made.','இந்த message 12,000 எழுத்துகளுக்கு மேல் உள்ளது. சிறிய பகுதியைத் தேர்வு செய்யுங்கள். பாதி message சோதிக்கப்படவில்லை.'],
  too_many_links:['This selection has more than 20 web links. Select a smaller part of the email to check.','இந்தப் பகுதியில் 20-க்கும் மேற்பட்ட web links உள்ளன. Email-ன் சிறிய பகுதியைத் தேர்வு செய்யுங்கள்.'],
  restricted:['This page cannot be read. Copy and paste the message below.','இந்த page-ஐ படிக்க முடியவில்லை. Message-ஐ கீழே copy–paste செய்யுங்கள்.'],
  empty:['Add a message first.','முதலில் message சேருங்கள்.']
};
function renderStatus(){
  $('#error').textContent=error?pick(errors[error]):'';
  $('#capture-status').textContent=status==='captured'
    ?pair('Text and web-link destinations captured. Review the text and remove secrets before checking. Editing the text switches to text-only checking.','Text மற்றும் web-link முகவரிகள் எடுக்கப்பட்டன. ரகசிய எண்களை நீக்குங்கள். Text-ஐ மாற்றினால் text மட்டும் சோதிக்கப்படும்.')
    :status==='edited'?pair('Checking edited text only. Capture again to include hidden link destinations.','மாற்றிய text மட்டும் சோதிக்கப்படும். மறைந்த link முகவரிகளையும் சேர்க்க மீண்டும் எடுக்கவும்.'):'';
}
function renderLinks(){
  const links=captured?.links||[];
  $('#links').hidden=!links.length;
  $('#link-list').replaceChildren();
  for(const link of links){
    const li=document.createElement('li');
    li.textContent=link.mismatch
      ?pair(`Shown: ${link.shownHost} → Goes to: ${link.host}`,`காட்டுவது: ${link.shownHost} → செல்லும் இடம்: ${link.host}`)
      :link.host;
    if(link.mismatch)li.className='mismatch';
    $('#link-list').append(li);
  }
}
function render(){
  if(!last)return;
  $('#result').hidden=false;
  $('#title').textContent=pick(labels[last.verdict]);
  $('#description').textContent=pick(descriptions[last.verdict]);
  $('#next').textContent=pick(actions[last.verdict]);
  $('#reasons').replaceChildren();
  const reasons=last.reasons.map(key=>pick(REASONS[key]));
  if(captured?.links.some(link=>link.mismatch))reasons.push(pair('A displayed web address differs from its link destination. Tracking links can also do this; verify independently.','காட்டப்படும் web முகவரியும் செல்லும் இடமும் வேறுபடுகின்றன. Tracking links-லும் இது நடக்கலாம்; தனியாக உறுதிப்படுத்துங்கள்.'));
  if(!reasons.length)reasons.push(last.verdict==='unclear'?pair('There is not enough text to assess.','சோதிக்கப் போதுமான text இல்லை.'):pair('No supported warning patterns found. This does not prove the message is safe.','ஆதரிக்கப்படும் எச்சரிக்கை அறிகுறிகள் இல்லை. இது பாதுகாப்பு உறுதி அல்ல.'));
  for(const reason of reasons){const li=document.createElement('li');li.textContent=reason;$('#reasons').append(li);}
}
$('#lang').addEventListener('change',()=>{
  lang=$('#lang').value==='ta'?1:0;document.documentElement.lang=lang?'ta':'en';
  const content={intro:['A second look before you click. Your message stays on this device.','Click செய்யும் முன் சரிபாருங்கள். Message இந்த சாதனத்திலேயே இருக்கும்.'],capture:['Use selected text / opened Gmail message','தேர்ந்தெடுத்த text / திறந்த Gmail message-ஐ எடு'],label:['Review the message or paste one below','Message-ஐ சரிபார்க்கவும் அல்லது கீழே paste செய்யவும்'],check:['Check message','Message-ஐ சரிபார்'],'next-title':['Next step','அடுத்த படி'],'links-title':['Link destinations (not opened)','Link செல்லும் இடங்கள் (திறக்கப்படாது)'],'links-note':['Names only. Redirects, attachments and sender identity are not verified.','பெயர்கள் மட்டும். Redirects, attachments அல்லது sender சரிபார்க்கப்படவில்லை.'],note:['Rule-based guidance, not a guarantee. No automatic inbox scanning or message uploads. Pasted text cannot reveal hidden links.','விதிகளின் அடிப்படையிலான வழிகாட்டி; உத்தரவாதம் அல்ல. Inbox தானாகப் படிக்கப்படாது. Message upload ஆகாது. Paste செய்த text-ல் மறைந்த link தெரியாது.']};
  for(const [id,words]of Object.entries(content))$('#'+id).textContent=pick(words);
  renderStatus();renderLinks();render();
});
$('#capture').addEventListener('click',async()=>{
  const button=$('#capture');button.disabled=true;
  last=null;captured=null;status='';error='';$('#text').value='';$('#result').hidden=true;renderLinks();renderStatus();
  try{
    const [tab]=await chrome.tabs.query({active:true,currentWindow:true});
    const response=await chrome.scripting.executeScript({target:{tabId:tab.id},func:captureMessage});
    const value=response[0]?.result;
    if(!value||value.error){error=Object.hasOwn(errors,value?.error)?value.error:'no_message';return;}
    captured=value;$('#text').value=value.text;status='captured';$('#text').focus();
  }catch{error='restricted';}finally{button.disabled=false;renderStatus();renderLinks();}
});
$('#text').addEventListener('input',()=>{if(captured)status='edited';captured=null;last=null;error='';$('#result').hidden=true;renderLinks();renderStatus();});
$('#check').addEventListener('click',()=>{
  last=null;$('#result').hidden=true;
  try{
    if(!$('#text').value.trim()){error='empty';return;}
    last=checkCapture($('#text').value,captured);error='';render();$('#result').focus();
  }catch{error='too_long';}finally{renderStatus();}
});
