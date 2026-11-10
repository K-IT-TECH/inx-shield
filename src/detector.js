import { normalizeMessage, messageClauses } from './message-text.js';

export const ENGINE_VERSION = 'rules-1.3.0';
export const MAX_LENGTH = 12000;

// Bounded, explainable patterns. This is not a trained language model.
const secret = String.raw`(?:\b(?:otp|pin|cvv|pass?word|passcode|one[ -]time (?:password|code)|(?:verification|verfication|security|login|authentication) code|(?:six|6)[ -]digit (?:verification |security )?code|code (?:you (?:just )?(?:received|got)|sent to (?:your|the) (?:phone|mobile)))\b|கடவுச்சொல்|ரகசிய (?:எண்|குறியீ(?:டு|ட்டை))|சரிபார்ப்பு(?:க்)? குறியீ(?:டு|ட்டை)|ஒரு முறை குறியீ(?:டு|ட்டை))`;
const request = String.raw`(?:\b(?:share|shre|send|snd|tell|give|reply|provide|enter|verify|forward|reveal|sollu(?:nga)?|solla|anupp?(?:u|unga|avum)|kodu(?:nga)?|kudu(?:nga)?)\b|அனுப்பு\p{L}*\p{M}*|பகிர்|பகிரு|சொல்லு|தெரிவி|கொடுக்|கொடு)`;
const credentials = new RegExp(String.raw`${request}.{0,55}?${secret}|${secret}.{0,45}?${request}|\b(?:what(?:'s| is)|(?:can|could) (?:i|we) have|(?:i|we) need)\b.{0,30}?${secret}`, 'iu');
const rules = [
  { id: 'credentials', weight: 4, pattern: credentials, request: true },
  { id: 'urgency', weight: 1, pattern: /\b(?:urgent|immediately|act now|within \d+ (?:minutes?|hours?)|last warning|final notice|expires? today|udan[ae]|seekiram|seekkiram)\b|உடனே|உடனடியாக|கடைசி எச்சரிக்கை|சீக்கிரம்/iu },
  { id: 'threat', weight: 2, pattern: /\b(?:(?:account|card|sim).{0,25}?(?:block(?:ed|edhu)?|suspend(?:ed)?|deactivat(?:ed|e)|clos(?:ed|e))|arrest|digital arrest|legal action)\b|(?:கணக்கு|கார்டு|சிம்).{0,20}?(?:முடக்க|தடை|செயலிழ)|கைது/iu },
  { id: 'prize', weight: 2, pattern: /\b(?:you(?:'ve| have)? won|lottery|claim your prize|free money|guaranteed (?:profit|returns?)|double your money|panam (?:double|rettippu)|parisu (?:vizhunth|venr|win))\b|பரிசு வென்|பரிசை(?:ப்)? பெற|லாட்டரி|பணம் இரட்டிப்பு/iu },
  { id: 'payment', weight: 2, request: true, pattern: /\b(?:pay.{0,25}?(?:fee|charge|deposit)|processing fee|release fee|advance payment|transfer.{0,20}?(?:money|funds)|gift cards?|crypto wallet|upi pin|(?:fee|deposit|panam|kaasu).{0,25}?(?:kattu(?:nga)?|seluthu(?:nga)?|anupp?(?:u|unga)|pay|transfer))\b|கட்டண.{0,20}?(?:செலுத்த|கட்டு)|முன்பணம்|பணம்.{0,15}?அனுப்பு/iu },
  { id: 'remote', weight: 3, request: true, pattern: /\b(?:install|download).{0,35}?(?:anydesk|teamviewer|apk|remote|screen.?shar)|\b(?:share|enable).{0,20}?(?:screen|screen.?shar)|\bscreen.?shar.{0,25}?(?:bank|payment)|\b(?:anydesk|teamviewer|apk).{0,25}?(?:install|download)\b|திரையை(?:ப்)? பகிர்|திரையை(?:ப்)? பகிரு/iu },
  { id: 'impersonation', weight: 1, pattern: /\b(?:bank|rbi|income tax|police|customs|courier|kyc|aadhaar)\b|வங்கி|காவல்துறை|ஆதார்/iu },
  { id: 'promotion', weight: 0, pattern: /\b(?:sale|discount|\d+% off|unsubscribe|limited offer|buy one|get one|shop now)\b|தள்ளுபடி|சலுகை|விற்பனை/iu }
];

export const REASONS = {
  credentials: ['Asks for a secret code or password','ரகசிய எண் அல்லது கடவுச்சொல் கேட்கிறது'],
  urgency: ['Pressures you to act quickly','உடனே செயல்பட அழுத்தம் தருகிறது'],
  threat: ['Threatens to block an account or take action','கணக்கை முடக்குவதாக அல்லது நடவடிக்கை எடுப்பதாக மிரட்டுகிறது'],
  prize: ['Promises a prize or unusually easy money','பரிசு அல்லது எளிதான வருமானம் தருவதாகச் சொல்கிறது'],
  payment: ['Mentions a fee, transfer, or sensitive payment action','கட்டணம், பணப்பரிமாற்றம் அல்லது ரகசிய payment தகவல் கேட்கிறது'],
  remote: ['Asks you to install remote access or share a screen','Remote access app அல்லது screen sharing கேட்கிறது'],
  impersonation: ['Uses the name of an authority or service','வங்கி அல்லது அதிகார அமைப்பின் பெயரைப் பயன்படுத்துகிறது'],
  short_link: ['Contains a shortened link that hides its destination','செல்லும் இடத்தை மறைக்கும் குறுகிய link உள்ளது'],
  unusual_link: ['Contains a misleading or unusual link format','சந்தேகமான link வடிவம் உள்ளது'],
  link: ['Contains a link; its destination has not been verified','Link உள்ளது; அதன் நம்பகத்தன்மை சரிபார்க்கப்படவில்லை'],
  promotion: ['Looks like an advertisement or offer','விளம்பரம் அல்லது சலுகை போலத் தெரிகிறது']
};

// Check negation near each request, rather than exempting a whole message.
function isAdvice(clause, match, previousEnd, id) {
  const before = clause.slice(Math.max(previousEnd, match.index - 75), match.index);
  const phrase = match[0];
  const after = clause.slice(match.index + phrase.length, match.index + phrase.length + 35);
  if (/\b(?:never|do not|don't|dont|must not|should not|shouldn't|avoid)(?:[\s,]+(?:ever|please|under any circumstances|on any account|ask (?:you )?to|tell (?:you )?to|need to))*[\s,]*$/iu.test(before)) return true;
  if (/(?:வேண்டாம்|வேண்டியதில்லை|கூடாது|மாட்டோம்|மாட்டேன்|அனுப்பாத|பகிராத|சொல்லாத|கொடுக்காத)/u.test(phrase + after.slice(0, 24))) return true;
  if (/\b(?:vendam|vendaam|koodathu|koodadhu|anupp?(?:atheenga|aathinga|aath[eai]|adhe)|soll(?:atheenga|aathinga)|pann(?:atheenga|aathinga))\b/iu.test(phrase + after)) return true;
  if (id === 'credentials' && /\b(?:we|i|app|system|bank)\s+(?:will|can)\s+(?:automatically\s+)?$/iu.test(before) && /^(?:send|give)\b/iu.test(phrase)) return true;
  return false;
}
function negatedThreat(text) {
  return /\b(?:not|never|no longer|isn't|isnt|won't|wont)(?:\s+be)?\s+(?:blocked|block|suspended|suspend|deactivated|closed|arrested)\b|முடக்கப்படாது|செயலிழக்காது|கைது இல்லை|block aagathu|block aagadhu/iu.test(text);
}

export function analyze(input, { links: capturedLinks = [], includeEvidence = false } = {}) {
  if (typeof input !== 'string') throw new TypeError('Message must be text');
  if (input.length > MAX_LENGTH) throw new RangeError('Message exceeds 12,000 characters');
  if (!Array.isArray(capturedLinks) || capturedLinks.length > 20 || capturedLinks.some(link => typeof link !== 'string' || link.length > 2048)) throw new TypeError('Invalid captured links');
  const { text, offsets } = normalizeMessage(input);
  const clauses = messageClauses(text);
  const reasons = [], evidence = [];
  let score = 0;
  function add(id, weight, start, end) {
    if (!reasons.includes(id)) { reasons.push(id); score += weight; }
    if (includeEvidence && evidence.length < 60 && Number.isInteger(start) && offsets[start] && offsets[end - 1]) {
      evidence.push({ id, start: offsets[start][0], end: offsets[end - 1][1] });
    }
  }
  for (const rule of rules) {
    const sections = rule.request || rule.id === 'threat' ? clauses : [{ text, start: 0 }];
    let count = 0;
    for (const section of sections) {
      let previousEnd = 0, previousAdvice = false;
      for (const match of section.text.matchAll(new RegExp(rule.pattern.source, 'gisu'))) {
        const ignored = (rule.request && isAdvice(section.text, match, previousEnd, rule.id))
          || (rule.request && previousAdvice && /^\s*(?:or|and)\s*$/iu.test(section.text.slice(previousEnd, match.index)))
          || (rule.id === 'threat' && negatedThreat(section.text.slice(match.index, match.index + match[0].length + 20)));
        previousEnd = match.index + match[0].length;
        previousAdvice = ignored;
        if (ignored) continue;
        add(rule.id, rule.weight, section.start + match.index, section.start + match.index + match[0].length);
        if (++count >= 5) break;
      }
      if (count >= 5) break;
    }
  }
  // Only hostname summaries leave the detector. No URL is ever fetched.
  const pasted = [...text.matchAll(/(?:https?:\/\/|www\.)[^\s<>"']+|(?<![\p{L}\p{N}_@.\-])(?:[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?\.)+[a-z]{2,63}\/[^\s<>"']*/giu)];
  const urls = [...capturedLinks.map(raw => ({ raw })), ...pasted.map(match => {
    const clean = match[0].replace(/[),.;!?]+$/u, '');
    return { raw: /^https?:\/\//iu.test(clean) ? clean : `https://${clean}`, start: match.index, end: match.index + clean.length };
  })];
  const links = [];
  for (const { raw, start, end } of urls.slice(0, 20)) {
    try {
      const url = new URL(raw);
      if (!['http:', 'https:'].includes(url.protocol)) continue;
      const host = url.hostname;
      links.push(host);
      if (/^(?:bit\.ly|tinyurl\.com|t\.co|cutt\.ly|rb\.gy|shorturl\.at)$/i.test(host)) add('short_link', 1, start, end);
      if (url.username || /(?:^|\.)xn--|^\d+\.\d+\.\d+\.\d+$/.test(host)) add('unusual_link', 2, start, end);
      add('link', 1, start, end);
    } catch { /* Invalid URLs provide no reliable signal. */ }
  }
  const dangerous = reasons.includes('credentials') || (reasons.includes('prize') && reasons.includes('payment'))
    || (reasons.includes('remote') && score >= 4) || score >= 6;
  const verdict = dangerous ? 'scam' : score >= 2 ? 'caution' : text.trim().length < 12 ? 'unclear' : reasons.includes('promotion') ? 'promotion' : 'low';
  const result = { verdict, reasons, links: [...new Set(links)], version: ENGINE_VERSION };
  // Evidence is opt-in, uses original UTF-16 offsets, and is never persisted.
  if (includeEvidence) result.evidence = evidence;
  return result;
}
