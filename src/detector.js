export const ENGINE_VERSION = 'rules-1.1.0';
export const MAX_LENGTH = 12000;

// Explainable signals, not a trained classifier or a guarantee of safety.
const rules = [
  { id:'credentials', weight:4, pattern:/(?:\b(?:share|send|tell|give|reply|provide|enter|verify)\b.{0,45}\b(?:otp|pin|password|one.time password|cvv)\b)|(?:(?:otp|pin|password|கடவுச்சொல்|ரகசிய எண்).{0,35}(?:அனுப்பு|பகிர்|சொல்லு|கொடுக்|sollu|anuppu|share|send))/iu },
  { id:'urgency', weight:1, pattern:/\b(?:urgent|immediately|act now|within \d+ (?:minutes?|hours?)|last warning|final notice|expires? today)\b|உடனே|உடனடியாக|கடைசி எச்சரிக்கை|udan[ae]/iu },
  { id:'threat', weight:2, pattern:/\b(?:(?:account|card|bank|sim).{0,25}(?:blocked|suspended|deactivated|closed)|arrest|digital arrest|legal action)\b|கணக்கு.{0,20}(?:முடக்க|தடை)|கைது/iu },
  { id:'prize', weight:2, pattern:/\b(?:you(?:'ve| have)? won|lottery|claim your prize|free money|guaranteed (?:profit|return)|double your money)\b|பரிசு வென்|பரிசை பெற|லாட்டரி|பணம் இரட்டிப்பு/iu },
  { id:'payment', weight:2, pattern:/\b(?:pay.{0,25}(?:fee|charge|deposit)|processing fee|release fee|advance payment|transfer.{0,20}(?:money|funds)|gift cards?|crypto wallet|upi pin)\b|கட்டணம் செலுத்த|முன்பணம்|பணம் அனுப்பு/iu },
  { id:'remote', weight:3, pattern:/\b(?:install|download).{0,35}(?:anydesk|teamviewer|apk|remote|screen.?shar)|\bscreen.?shar.{0,25}(?:bank|payment)|திரையை பகிர்/iu },
  { id:'impersonation', weight:1, pattern:/\b(?:bank|rbi|income tax|police|customs|courier|kyc|aadhaar)\b|வங்கி|காவல்துறை|ஆதார்/iu },
  { id:'promotion', weight:0, pattern:/\b(?:sale|discount|\d+% off|unsubscribe|limited offer|buy one|get one|shop now)\b|தள்ளுபடி|சலுகை|விற்பனை/iu }
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

export function analyze(input, {links:capturedLinks=[]} = {}) {
  if (typeof input !== 'string') throw new TypeError('Message must be text');
  if (input.length > MAX_LENGTH) throw new RangeError('Message exceeds 12,000 characters');
  const text = input.normalize('NFKC').replace(/[\u200B-\u200D\uFEFF]/g,'').trim();
  if (!Array.isArray(capturedLinks) || capturedLinks.length > 20 || capturedLinks.some(link => typeof link !== 'string' || link.length > 2048)) throw new TypeError('Invalid captured links');
  if (text.length < 12 && !capturedLinks.length) return {verdict:'unclear', reasons:[], links:[], version:ENGINE_VERSION};
  // Ignore explicit safety advice when evaluating secret-sharing requests.
  const withoutAdvice = text.split(/[.!?\n]+/u).filter(s => !/(?:\b(?:never|do not|don't|dont)\b.{0,25}(?:share|send|give|tell)|பகிர வேண்டாம்|பகிராதீ|அனுப்பாதீ)/iu.test(s)).join('. ');
  let score = 0; const reasons = [];
  for (const rule of rules) {
    if (rule.pattern.test(rule.id === 'credentials' ? withoutAdvice : text)) {
      reasons.push(rule.id); score += rule.weight;
    }
  }
  const urls = [...capturedLinks, ...(text.match(/(?:https?:\/\/|www\.)[^\s<>"']+/giu) || [])];
  const links = [];
  for (const raw of urls.slice(0,20)) {
    try {
      const url = new URL(raw.startsWith('www.') ? `https://${raw}` : raw);
      if (!['http:', 'https:'].includes(url.protocol)) continue;
      const host = url.hostname;
      links.push(host); // Never fetch, render as a link, or retain path/query.
      if (/^(?:bit\.ly|tinyurl\.com|t\.co|cutt\.ly|rb\.gy|shorturl\.at)$/i.test(host) && !reasons.includes('short_link')) { reasons.push('short_link'); score += 1; }
      if ((url.username || /(?:^|\.)xn--|^\d+\.\d+\.\d+\.\d+$/.test(host)) && !reasons.includes('unusual_link')) { reasons.push('unusual_link'); score += 2; }
    } catch { /* Invalid URL provides no reliable signal. */ }
  }
  if (links.length) { reasons.push('link'); score += 1; }
  const dangerous = reasons.includes('credentials') || (reasons.includes('prize') && reasons.includes('payment')) || (reasons.includes('remote') && score >= 4) || score >= 6;
  const verdict = dangerous ? 'scam' : score >= 3 ? 'caution' : text.length < 12 ? 'unclear' : reasons.includes('promotion') ? 'promotion' : 'low';
  return { verdict, reasons:[...new Set(reasons)], links:[...new Set(links)], version:ENGINE_VERSION };
}

