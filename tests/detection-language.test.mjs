import test from 'node:test';
import assert from 'node:assert/strict';
import { analyze } from '../src/detector.js';
import { evidenceSegments } from '../src/evidence.js';
import { normalizeHistory } from '../src/history.js';

// Synthetic challenge cases. These are development regressions, not a measured
// real-world accuracy claim, and are not the user's two unprovided messages.
const requests = [
  'What is your OTP? I need it to finish the refund.',
  'Could I have the verification code you received?',
  'We need your login code to release the parcel.',
  'Please snd the OTP to this chat.',
  'Shre your pasword for the account update.',
  'Forward the six-digit code to our agent.',
  'Tell me the code you just received on your phone.',
  'Unga OTP ah sollunga please.',
  'OTP-ai kudunga, refund process pannalam.',
  'OTP solla mudiyuma?',
  'Unga OTP anupunga.',
  'உங்கள் ரகசிய குறியீட்டை சொல்லுங்கள்.',
  'உங்கள் சரிபார்ப்பு குறியீடு கொடுங்கள்.',
  'ஓ.டி.பி. அனுப்புங்கள்.',
  'Never share OTP, send your OTP to me instead.',
  'OTP share panna vendam. Aana unga password sollunga.',
  'Don’t share codes with strangers. We need your passcode.',
  'Do not delay and send your OTP to me.',
  'Do not hesitate to provide your password.'
];
for (const message of requests) test(`Secret request: ${message}`, () => {
  const result = analyze(message, { includeEvidence: true });
  assert.equal(result.verdict, 'scam');
  assert.ok(result.evidence.some(span => span.id === 'credentials'));
});
const neutral = [
  'Please send the source code for our college project.',
  'Share the postal code so I can mail your book.',
  'Your OTP is 123456. Never share your OTP with anyone.',
  'We will send your OTP after you sign in.',
  'OTP share panna vendam.',
  'OTP anuppatheenga.',
  'உங்கள் கடவுச்சொல் பகிரக்கூடாது.',
  'OTP அனுப்ப வேண்டாம்.',
  'Do not install AnyDesk from an unknown message.',
  'Never pay a processing fee for a prize.',
  'Your account is not blocked.',
  'The account is no longer suspended.',
  'Your account will not be blocked.',
  'உங்கள் கணக்கு முடக்கப்படாது.',
  'Please call me seekiram about dinner.',
  'Hi, this is my new number. Are you free for lunch?',
  'The school fee receipt is ready for collection.',
  '20% off notebooks at our shop. Reply STOP to unsubscribe.'
];
for (const message of neutral) test(`Legitimate/advice contrast: ${message}`, () => {
  const result = analyze(message);
  assert.ok(['low', 'unclear', 'promotion'].includes(result.verdict), JSON.stringify(result));
  assert.ok(!result.reasons.includes('credentials'));
});
for (const message of [
  'Registration fee kattunga to start the job.',
  'Panam anuppunga to release your order.',
  'Your SIM block aagum. Update now.',
  'Your account not verified - blocked tomorrow.',
  'கட்டணத்தை உடனே செலுத்துங்கள்.',
  'AnyDesk install pannunga so we can assist.'
]) test(`Additional caution: ${message}`, () => assert.ok(['caution', 'scam'].includes(analyze(message).verdict)));

test('Evidence maps full-width, dotted initials, zero-width and Tamil back to exact original text', () => {
  for (const input of ['🙂 Ｓｅｎｄ ＯＴＰ', 'Please sh\u200bare your O.T.P. to me.', 'உங்கள் ஓ.டி.பி. அனுப்புங்கள்.', 'send\nOTP', 'Send OTP twice. Send OTP again.']) {
    const result = analyze(input, { includeEvidence: true });
    const parts = evidenceSegments(input, result.evidence);
    assert.equal(parts.map(part => part.text).join(''), input);
    assert.ok(parts.some(part => part.ids.includes('credentials')));
    for (const span of result.evidence) {
      assert.deepEqual(Object.keys(span).sort(), ['end', 'id', 'start']);
      assert.ok(span.start >= 0 && span.end <= input.length && span.start < span.end);
    }
  }
});
test('Merged highlights retain all matched reasons and preserve markup as text', () => {
  const text = '<img src=x onerror=alert(1)> Pay a processing fee https://bit.ly/example';
  const result = analyze(text, { includeEvidence: true });
  const parts = evidenceSegments(text, result.evidence);
  assert.equal(parts.map(part => part.text).join(''), text);
  assert.ok(parts.some(part => part.ids.includes('short_link') && part.ids.includes('link')));
  assert.doesNotMatch(JSON.stringify(result), /onerror|processing fee|example/);
});
test('Only active requests are highlighted after safety advice', () => {
  const text = 'Never share OTP with strangers, but send OTP to me.';
  const result = analyze(text, { includeEvidence: true });
  const marks = result.evidence.filter(span => span.id === 'credentials').map(span => text.slice(span.start, span.end));
  assert.deepEqual(marks, ['send OTP']);
});
test('History never retains opt-in evidence or original message', () => {
  const result = analyze('Send your OTP to me.', { includeEvidence: true });
  const [row] = normalizeHistory([{ id: 'check-evidence-test', source: 'sms', verdict: result.verdict, reason_codes: result.reasons, engine_version: result.version, created_at: '2026-11-09T12:00:00Z', evidence: result.evidence, text: 'Send your OTP to me.' }]);
  assert.ok(row);
  assert.ok(!('evidence' in row));
  assert.doesNotMatch(JSON.stringify(row), /Send your|"text"/);
});

test('Maximum-length Unicode expansion completes without overflowing the offset map', () => {
  const result = analyze('\uFDFA'.repeat(12000), { includeEvidence: true });
  assert.equal(result.verdict, 'low');
  assert.deepEqual(result.evidence, []);
});
