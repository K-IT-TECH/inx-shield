import { normalizeMessage } from './message-text.js';
import { MAX_LENGTH } from './detector.js';

// Labels describe matched patterns, not verified scam identities. Never persist text here.
export const CATEGORIES = {
  job: { label: ['Job / task fee request', 'வேலை / task கட்டணக் கோரிக்கை'], detail: ['A job or task offer appears alongside a payment request. Verify the employer independently before paying.', 'வேலை அல்லது task தகவலுடன் பணக் கோரிக்கை உள்ளது. பணம் செலுத்தும் முன் நிறுவனத்தைத் தனியாக உறுதிப்படுத்துங்கள்.'] },
  delivery: { label: ['Delivery fee request', 'பார்சல் கட்டணக் கோரிக்கை'], detail: ['Delivery wording appears with a fee request. Check the order in the delivery service’s official app.', 'பார்சல் தகவலுடன் கட்டணக் கோரிக்கை உள்ளது. Delivery நிறுவனத்தின் official app-ல் order-ஐச் சரிபாருங்கள்.'] },
  account: { label: ['Account / identity threat', 'கணக்கு / அடையாள மிரட்டல்'], detail: ['The message threatens an account, card, SIM or identity-related action. Verify it through a known contact.', 'கணக்கு, கார்டு, SIM அல்லது அடையாளம் தொடர்பாக மிரட்டுகிறது. நம்பகமான தொடர்பு வழியாக உறுதிப்படுத்துங்கள்.'] },
  prize: { label: ['Prize / lottery claim', 'பரிசு / லாட்டரி அறிவிப்பு'], detail: ['Prize wording is present. A claim in a message does not prove that a prize exists.', 'பரிசு பற்றிய சொற்கள் உள்ளன. Message-ல் சொல்வதால் பரிசு உண்மையானது என்று உறுதியாகாது.'] },
  investment: { label: ['Easy-money investment offer', 'எளிதான முதலீட்டு வருமான வாக்குறுதி'], detail: ['The wording promises unusually easy money or returns. Verify the offer independently.', 'எளிதாக பணம் அல்லது வருமானம் கிடைக்கும் என்று கூறுகிறது. சலுகையைத் தனியாக உறுதிப்படுத்துங்கள்.'] },
  remote: { label: ['Remote access / screen sharing', 'Remote access / திரைப் பகிர்வு'], detail: ['The message asks for software access or screen sharing. Do not grant access based only on this message.', 'App access அல்லது திரைப் பகிர்வு கேட்கிறது. இந்த message-ஐ மட்டும் நம்பி access கொடுக்காதீர்கள்.'] },
  credentials: { label: ['Secret-code request', 'ரகசியக் குறியீட்டுக் கோரிக்கை'], detail: ['A request for a code or password was detected. Do not share it with someone who contacts you.', 'Code அல்லது password கோரிக்கை கண்டறியப்பட்டது. உங்களைத் தொடர்புகொள்ளும் நபரிடம் பகிராதீர்கள்.'] },
  payment: { label: ['Money / payment request', 'பணம் / payment கோரிக்கை'], detail: ['Payment wording was detected. A genuine payment reminder can also match; confirm the recipient and purpose.', 'பணம் பற்றிய கோரிக்கை உள்ளது. உண்மையான payment நினைவூட்டலும் பொருந்தலாம்; பெறுபவரையும் காரணத்தையும் உறுதிப்படுத்துங்கள்.'] }
};

const topics = {
  job: /\b(?:job|hired|recruit(?:er|ment)?|employ(?:er|ment)?|offer letter|work from home|part.time|task|velai)\b|வேலை|பணி வாய்ப்பு/iu,
  delivery: /\b(?:parcel|courier|delivery|redelivery|shipment|shipping)\b|பார்சல்|விநியோக|டெலிவரி/iu,
  account: /\b(?:account|card|sim|kyc|aadhaar)\b|கணக்கு|கார்டு|சிம்|ஆதார்/iu,
  prize: /\b(?:prize|lottery|won|jackpot|parisu)\b|பரிசு|லாட்டரி/iu,
  investment: /\b(?:invest\w*|profit|returns?|double|panam rettippu)\b|முதலீடு|பணம் இரட்டிப்பு/iu
};

export function classifyPatterns(input, result) {
  if (typeof input !== 'string' || input.length > MAX_LENGTH || !Array.isArray(result?.reasons)) return [];
  if (!['scam', 'caution'].includes(result.verdict)) return [];
  const { text } = normalizeMessage(input);
  const has = id => result.reasons.includes(id);
  const ids = [];
  if (has('payment') && topics.job.test(text)) ids.push('job');
  if (has('payment') && topics.delivery.test(text)) ids.push('delivery');
  if (has('threat') && topics.account.test(text)) ids.push('account');
  if (has('prize') && topics.prize.test(text)) ids.push('prize');
  if (has('prize') && topics.investment.test(text)) ids.push('investment');
  if (has('remote')) ids.push('remote');
  if (has('credentials')) ids.push('credentials');
  if (has('payment') && !ids.some(id => ['job', 'delivery', 'prize', 'investment'].includes(id))) ids.push('payment');
  return ids;
}

export const CONTEXT_OPTIONS = {
  expected: ['unknown', 'yes', 'no'],
  sender: ['unknown', 'known', 'unrecognized'],
  request: ['unknown', 'none', 'money', 'secret', 'access']
};
export function normalizeContext(value) {
  return Object.fromEntries(Object.entries(CONTEXT_OPTIONS).map(([key, choices]) => [key, choices.includes(value?.[key]) ? value[key] : 'unknown']));
}

export const CONTEXT_MESSAGES = {
  secret: ['Do not give a secret code or password to the person contacting you. Open the official app yourself to verify the request.', 'உங்களைத் தொடர்புகொள்ளும் நபரிடம் ரகசிய code அல்லது password கொடுக்காதீர்கள். Official app-ஐ நீங்களே திறந்து உறுதிப்படுத்துங்கள்.'],
  access: ['Pause before installing software or sharing your screen. Contact the service through a channel you already trust.', 'App install செய்வதற்கும் திரையைப் பகிர்வதற்கும் முன் நிறுத்துங்கள். நம்பகமான வழியில் நிறுவனத்தைத் தொடர்புகொள்ளுங்கள்.'],
  money: ['Confirm both the recipient and the reason for payment using a known number or official app. A familiar name can be copied.', 'தெரிந்த எண் அல்லது official app மூலம் பெறுபவரையும் பணம் கேட்கும் காரணத்தையும் உறுதிப்படுத்துங்கள். தெரிந்த பெயரையும் வேறொருவர் பயன்படுத்தலாம்.'],
  unexpected: ['You were not expecting this message. Verify what prompted it before following its instructions.', 'இந்த message-ஐ நீங்கள் எதிர்பார்க்கவில்லை. அதன் வழிமுறைகளைப் பின்பற்றும் முன் காரணத்தை உறுதிப்படுத்துங்கள்.'],
  unrecognized: ['You do not recognize the sender. Avoid using this message’s own link or number as your only verification.', 'Sender யார் என்று தெரியவில்லை. உறுதிப்படுத்த இந்த message-ல் உள்ள link அல்லது எண்ணை மட்டும் பயன்படுத்தாதீர்கள்.'],
  familiar: ['Recognizing a name or expecting a message does not authenticate it. Existing warning signs still apply.', 'தெரிந்த பெயர் அல்லது எதிர்பார்த்த message என்பதால் அது உண்மையானது என்று உறுதியாகாது. கண்டறிந்த எச்சரிக்கைகள் இன்னும் பொருந்தும்.'],
  none: ['No sensitive action is reported in your answers. This is not a safety verdict; check any later request separately.', 'உங்கள் பதிலில் ரகசியத் தகவல் அல்லது பணம் பற்றிய செயல் இல்லை. இது பாதுகாப்பு உறுதி அல்ல; பின்னர் வரும் கோரிக்கையைத் தனியாகச் சரிபாருங்கள்.'],
  incomplete: ['You can leave any answer as “Not sure.” More context may help you choose how to verify the request.', 'எந்த பதிலையும் “தெரியவில்லை” என்று விடலாம். கூடுதல் தகவல் கோரிக்கையை உறுதிப்படுத்த உதவும்.']
};

// Supplementary advice only: self-reported familiarity must never lower the text verdict.
export function assessContext(value) {
  const context = normalizeContext(value), ids = [];
  if (context.request === 'secret' || context.request === 'access') ids.push(context.request);
  if (context.request === 'money') ids.push('money');
  if (context.expected === 'no') ids.push('unexpected');
  if (context.sender === 'unrecognized') ids.push('unrecognized');
  if (context.expected === 'yes' || context.sender === 'known') ids.push('familiar');
  if (context.request === 'none') ids.push('none');
  const answered = Object.values(context).some(value => value !== 'unknown');
  if (answered && !ids.length) ids.push('incomplete');
  const level = ['secret', 'access'].includes(context.request) ? 'pause'
    : context.request === 'money' || context.expected === 'no' || context.sender === 'unrecognized' ? 'verify' : 'neutral';
  return { answered, level, ids };
}
