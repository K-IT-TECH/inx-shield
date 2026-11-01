const notices={
  missing:['The shared message is no longer available. Share it again or paste it here.','Share செய்த message கிடைக்கவில்லை. மீண்டும் share அல்லது paste செய்யுங்கள்.'],
  'too-long':['The shared message exceeds 12,000 characters. Copy a shorter section; no partial check was made.','Share செய்த message 12,000 எழுத்துகளுக்கு மேல் உள்ளது. சிறிய பகுதியை copy செய்யுங்கள். பாதி message சோதிக்கப்படவில்லை.'],
  unavailable:['Sharing is not ready in this browser. Open the installed app again or paste your message here.','இந்த browser-ல் share இன்னும் தயாராகவில்லை. Installed app-ஐ மீண்டும் திறக்கவும் அல்லது இங்கே paste செய்யவும்.']
};
export function connectSharing({onMessage,onNotice,language}) {
  const announce=code=>onNotice(notices[code][language()==='ta'?1:0]);
  const url=new URL(location.href), id=url.searchParams.get('share');
  if(id){url.searchParams.delete('share');history.replaceState(null,'',url.pathname+url.search+url.hash);}
  if(!('serviceWorker' in navigator)){if(id)announce('unavailable');return;}
  const worker=navigator.serviceWorker;
  const registration=worker.register('/sw.js');
  if(!id){registration.catch(()=>{});return;}
  if(Object.hasOwn(notices,id)){announce(id);registration.catch(()=>{});return;}
  let pending=true, sent=false;
  const finish=()=>{pending=false;clearTimeout(timer);worker.removeEventListener('message',receive);worker.removeEventListener('controllerchange',request);};
  const request=()=>{if(pending&&!sent&&worker.controller){sent=true;worker.controller.postMessage({type:'GET_SHARE',id});}};
  const receive=event=>{
    if(!pending||event.source!==worker.controller)return;
    if(event.data?.type==='SHARED_MESSAGE'&&typeof event.data.text==='string'){
      finish();if(event.data.text.length>12000)announce('too-long');else onMessage(event.data.text);
    }else if(event.data?.type==='SHARE_MISSING'){finish();announce('missing');}
  };
  const timer=setTimeout(()=>{if(pending){finish();announce('unavailable');}},8000);
  worker.addEventListener('message',receive);worker.addEventListener('controllerchange',request);
  request();registration.then(request).catch(()=>{if(pending){finish();announce('unavailable');}});
}
