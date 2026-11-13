import { CATEGORIES, classifyPatterns, CONTEXT_MESSAGES, assessContext } from './guidance.js';

const words = {
  'category-title': ['Possible scam patterns', 'பொருந்தக்கூடிய மோசடி வகைகள்'],
  'category-note': ['Based on wording, not a verified identity or confirmed scam.', 'சொற்களின் அடிப்படையில் மட்டும்; sender அல்லது மோசடி உறுதிப்படுத்தப்படவில்லை.'],
  'context-title': ['Add context for your next step', 'அடுத்த படிக்கு கூடுதல் தகவல்'],
  'context-intro': ['Optional. Answers stay here and clear with a new message. They add guidance without removing text warnings.', 'விருப்பம். பதில்கள் இங்கேயே இருக்கும்; புதிய message வந்தால் நீங்கும். இவை வழிகாட்டும்; text எச்சரிக்கைகளை நீக்காது.'],
  'context-expected-label': ['Were you expecting this message?', 'இந்த message-ஐ எதிர்பார்த்தீர்களா?'],
  'context-sender-label': ['Do you recognize the sender?', 'Sender யார் என்று தெரியுமா?'],
  'context-request-label': ['What are they asking you to do?', 'என்ன செய்யச் சொல்கிறார்கள்?'],
  'context-expected-unknown': ['Not sure / skip', 'தெரியவில்லை / தவிர்'],
  'context-expected-yes': ['Yes, I expected it', 'ஆம், எதிர்பார்த்தேன்'],
  'context-expected-no': ['No, it was unexpected', 'இல்லை, எதிர்பார்க்கவில்லை'],
  'context-sender-unknown': ['Not sure / skip', 'தெரியவில்லை / தவிர்'],
  'context-sender-known': ['I recognize the name or number', 'பெயர் அல்லது எண் தெரியும்'],
  'context-sender-unrecognized': ['I do not recognize them', 'யார் என்று தெரியாது'],
  'context-request-unknown': ['Not sure / skip', 'தெரியவில்லை / தவிர்'],
  'context-request-none': ['No money, secrets or access', 'பணம், ரகசியத் தகவல், access இல்லை'],
  'context-request-money': ['Send money or pay a fee', 'பணம் அல்லது கட்டணம் செலுத்த'],
  'context-request-secret': ['Share a code or password', 'Code அல்லது password பகிர'],
  'context-request-access': ['Install an app or share my screen', 'App install / திரையைப் பகிர'],
  'context-reset': ['Clear answers', 'பதில்களை நீக்கு'],
  'context-save-note': ['Saved results and feedback reports contain the text check only. These answers and extra guidance are not saved.', 'சேமித்த முடிவுகளும் feedback report-களும் text சோதனையை மட்டும் கொண்டிருக்கும். இந்த பதில்களும் கூடுதல் வழிகாட்டலும் சேமிக்கப்படாது.']
};
const titles = {
  pause: ['Pause before giving access or secrets', 'Access அல்லது ரகசியம் கொடுக்கும் முன் நிறுத்துங்கள்'],
  verify: ['Extra caution from your answers', 'உங்கள் பதில்களின் அடிப்படையில் கூடுதல் கவனம்'],
  neutral: ['Keep verifying independently', 'தனியாக உறுதிப்படுத்துங்கள்']
};

export function connectInsights({ language, onChange = () => {} }) {
  const $ = id => document.getElementById(id);
  const pick = pair => pair[language() === 'ta' ? 1 : 0];
  let categories = [];
  function renderCategories() {
    $('category-panel').hidden = !categories.length;
    $('category-list').replaceChildren();
    for (const id of categories) {
      const item = document.createElement('li');
      const title = document.createElement('strong');
      title.textContent = pick(CATEGORIES[id].label);
      const explanation = document.createElement('p');
      explanation.textContent = pick(CATEGORIES[id].detail);
      item.append(title); item.append(explanation); $('category-list').append(item);
    }
  }
  function renderContext() {
    const report = assessContext(Object.fromEntries(['expected', 'sender', 'request'].map(key => [key, $('context-' + key).value])));
    $('context-advice').hidden = !report.answered;
    $('context-advice').className = 'context-advice ' + report.level;
    $('context-advice-title').textContent = report.answered ? pick(titles[report.level]) : '';
    $('context-advice-list').replaceChildren();
    for (const id of report.ids) {
      const item = document.createElement('li'); item.textContent = pick(CONTEXT_MESSAGES[id]); $('context-advice-list').append(item);
    }
    $('context-reset').disabled = !report.answered;
  }
  function clearAnswers() {
    for (const key of ['expected', 'sender', 'request']) $('context-' + key).value = 'unknown';
    renderContext();
  }
  for (const key of ['expected', 'sender', 'request']) $('context-' + key).addEventListener('change', () => { renderContext(); onChange(); });
  $('context-reset').addEventListener('click', () => { clearAnswers(); onChange(); });
  return {
    render(text, result) { categories = classifyPatterns(text, result); this.translate(); },
    translate() { for (const [id, pair] of Object.entries(words)) $(id).textContent = pick(pair); renderCategories(); renderContext(); },
    reset() { categories = []; renderCategories(); clearAnswers(); $('context-details').open = false; }
  };
}
