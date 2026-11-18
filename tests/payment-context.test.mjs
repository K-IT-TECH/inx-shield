import test from 'node:test';
import assert from 'node:assert/strict';
import { analyze } from '../src/detector.js';
import { classifyPatterns, CATEGORIES } from '../src/guidance.js';
import { evidenceSegments } from '../src/evidence.js';
import { normalizeHistory } from '../src/history.js';

const indirectRequests = [
  'Mum, this is my new number. I need money for a friend.',
  'Dad, I lost my phone. Could you help me with some cash?',
  'This is my replacement mobile number. I need some funds for rent.',
  'அம்மா, என் பழைய போன் உடைந்துவிட்டது. இது என் புதிய எண். நண்பருக்கு உதவி செய்ய பணம் வேண்டும்.',
  'அப்பா இது புது நம்பர். கொஞ்சம் காசு வேணும்.',
  'அக்கா இது என் புதிய எண். எனக்கு பணம் தேவை.',
  'Amma old phone damage. Idhu new number. Friend ku konjam cash venum help pannunga.',
  'Appa pudhu number idhu. Panam thevai.',
  'Akka idhu puthu mobile number. Konjam kaasu venum.',
  'எனக்கு பணத்தை அனுப்புங்கள்.',
  'Enakku money transfer pannunga.',
  'Cash anuppunga please.'
];
for (const message of indirectRequests) test(`Money request receives verification guidance: ${message}`, () => {
  const result = analyze(message, { includeEvidence: true });
  assert.ok(['caution', 'scam'].includes(result.verdict), JSON.stringify(result));
  assert.ok(result.reasons.includes('payment'));
  assert.ok(result.evidence.some(span => span.id === 'payment'));
  assert.equal(evidenceSegments(message, result.evidence).map(part => part.text).join(''), message);
});

const inPerson = [
  'Please pay the tuition fee at the school office this week.',
  'At the college office, pay the exam fee and collect your receipt.',
  'Pay the library fee in person at the school counter.',
  'பள்ளி அலுவலகத்தில் கல்வி கட்டணம் செலுத்துங்கள்.',
  'கல்லூரி அலுவலகத்தில் தேர்வுக் கட்டணத்தை செலுத்துங்கள்.',
  'College exam fee kattunga, office counter la receipt vangikonga.',
  'School office la fees pay pannunga.'
];
for (const message of inPerson) test(`In-person fee alone avoids a scam warning: ${message}`, () => {
  const result = analyze(message);
  assert.equal(result.verdict, 'low', JSON.stringify(result));
  assert.ok(result.reasons.includes('payment'), 'Payment information must remain visible');
});

for (const message of [
  'Pay the school fee online.',
  'Pay the tuition fee at the school office using gift cards.',
  'Pay a registration fee at the college office for this job.',
  'Pay the tuition fee at the school office. Send money to my account.',
  'Pay the tuition fee at the school office; transfer cash to me instead.',
  'Pay the tuition fee at the school office through https://college.example/pay.',
  'Pay the tuition fee at the school office. Details: fees.example/pay',
  'College office la fee kattunga. Kaasu anuppunga.',
  'பள்ளி அலுவலகத்தில் கட்டணம் செலுத்துங்கள். பணத்தை அனுப்புங்கள்.',
  'Pay the tuition fee, not at the school office.',
  'The school office is closed, pay the exam fee to the number provided.',
  'Pay the tuition fee at the school office. UPI details will follow.',
  'This is my new number. Pay the tuition fee at the school office.',
  'School office closed, fee kattunga.',
  'பள்ளி அலுவலகம் வர வேண்டாம், கட்டணம் செலுத்துங்கள்.'
]) test(`In-person wording cannot excuse a risky or separate request: ${message}`, () => {
  assert.ok(['caution', 'scam'].includes(analyze(message).verdict));
});

test('A captured destination prevents neutral treatment of an otherwise in-person reminder', () => {
  assert.equal(analyze(inPerson[0], { links: ['https://fee-collection.example/'] }).verdict, 'caution');
});

test('Repeated neutral fee matches cannot exhaust the limit before a later payment request', () => {
  const message = inPerson[0].repeat(8) + ' Please transfer money to me.';
  assert.equal(analyze(message).verdict, 'caution');
});

test('Unrelated distant or separated contact changes cannot contextualize a money statement', () => {
  for (const gap of ['\n\n', ' Ordinary words. '.repeat(35)]) {
    assert.equal(analyze('This is my new number.' + gap + 'I need money for a bicycle.').verdict, 'low');
  }
});

for (const message of [
  'Mum, this is my new number. Lunch at one?',
  'My new phone arrived. I need money for a laptop.',
  'This is my new number. I do not need money.',
  'This is my new number. Never send money to someone claiming to be me.',
  'இது என் புதிய எண். பணம் தேவை இல்லை.',
  'இது என் புதிய எண். பணம் அனுப்ப வேண்டாம்.',
  'Idhu pudhu number. Enakku panam vendaam.',
  'Unknown number ku cash anuppatheenga.',
  'We will send cash after you collect the receipt.'
]) test(`Contact details, statements and negated requests stay neutral: ${message}`, () => {
  assert.ok(['low', 'unclear', 'promotion'].includes(analyze(message).verdict));
});

test('In-person words do not remove a separate secret request or genuine link uncertainty', () => {
  assert.equal(analyze(inPerson[0] + ' Send your OTP to me.').verdict, 'scam');
  assert.equal(analyze('School newsletter: https://bit.ly/class-note').verdict, 'caution');
});

test('New-number explanations use bilingual wording without claiming an authenticated identity', () => {
  const message = indirectRequests[3];
  assert.ok(classifyPatterns(message, analyze(message)).includes('changed_contact'));
  assert.ok(CATEGORIES.changed_contact.label.every(Boolean));
  assert.match(CATEGORIES.changed_contact.detail[0], /known number/);
});

test('New money detections remain compatible with summary storage and database reason allowlist', () => {
  const result = analyze(indirectRequests[3], { includeEvidence: true });
  const [row] = normalizeHistory([{ id: 'check-newnumber-case', source: 'sms', verdict: result.verdict, reason_codes: result.reasons, engine_version: result.version, created_at: '2026-11-17T16:00:00Z' }]);
  assert.ok(row);
  assert.deepEqual(row.reason_codes, ['payment']);
  assert.doesNotMatch(JSON.stringify(row), /அம்மா|evidence|text/);
});
