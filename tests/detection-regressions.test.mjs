import test from 'node:test';
import assert from 'node:assert/strict';
import { analyze, MAX_LENGTH } from '../src/detector.js';

// Independently written examples, not the app's demonstration samples.
// These are regression cases, not an accuracy benchmark or the user's messages.
const credentialRequests = [
  ['short English request', 'send OTP'],
  ['short PIN request', 'Send PIN'],
  ['short Tanglish request', 'OTP anuppu'],
  ['Tanglish spelling variant', 'OTP anupu'],
  ['polite Tanglish request', 'OTP anuppunga'],
  ['Tamil request', 'OTP அனுப்பு'],
  ['line-wrapped request', 'send\nOTP'],
  ['dotted code', 'Please send your O.T.P. to confirm the request.'],
  ['spaced code', 'Please reply with your O T P to continue.'],
  ['dashed PIN', 'Send your P-I-N to finish verification.'],
  ['dotted CVV', 'Please provide the C.V.V. from your card.'],
  ['full-width text', 'Ｓｅｎｄ ＯＴＰ'],
  ['verification-code wording', 'Forward your verification code to this number.'],
  ['advice followed by contrast', 'Never share your OTP with strangers, but send your OTP to me for verification.'],
  ['advice followed by a new line', 'Never share your OTP with strangers.\nSend your OTP to me for verification.'],
  ['advice on a separate line without punctuation', 'Never share your OTP with strangers\nSend your OTP to me for verification.']
];
for (const [name, message] of credentialRequests) {
  test(`Detection regression: ${name}`, () => {
    const result = analyze(message);
    assert.equal(result.verdict, 'scam');
    assert.ok(result.reasons.includes('credentials'));
  });
}

for (const message of [
  'Never share your OTP or send your password to anyone.',
  'Don’t share your O.T.P. with anyone.',
  'Do not, under any circumstances, share your OTP.',
  'OTP யாரிடமும் பகிர வேண்டாம்.',
  'Hello, who is this?',
  'The OTP sender is unknown.',
  'Your password was shared during the demo.',
  'Please call me immediately about dinner.'
]) {
  test(`Benign contrast remains unflagged: ${message}`, () => {
    const result = analyze(message);
    assert.equal(result.verdict, 'low');
    assert.ok(!result.reasons.includes('credentials'));
  });
}

test('An isolated fee request or account threat receives caution, not a reassuring result', () => {
  assert.equal(analyze('Pay a registration fee to start this job.').verdict, 'caution');
  assert.equal(analyze('Your account will be suspended.').verdict, 'caution');
});
test('A pasted domain/path is inspected without returning its private path or query', () => {
  const result = analyze('Your parcel is held. Pay a delivery fee at delivery-update.example/claim?token=private');
  assert.equal(result.verdict, 'caution');
  assert.deepEqual(result.links, ['delivery-update.example']);
  assert.doesNotMatch(JSON.stringify(result), /claim|token|private/);
});
test('Scheme-less short links and uppercase WWW names are recognized', () => {
  assert.ok(analyze('Details: bit.ly/newsletter').reasons.includes('short_link'));
  assert.deepEqual(analyze('Your appointment: WWW.CLINIC.EXAMPLE/visit').links, ['www.clinic.example']);
});
test('An ordinary domain/path alone does not imply a scam', () => {
  const result = analyze('School newsletter: school.example/news');
  assert.equal(result.verdict, 'low');
  assert.deepEqual(result.links, ['school.example']);
});
test('Filenames and email addresses are not mistaken for pasted links', () => {
  assert.deepEqual(analyze('Please read report.pdf and email support@school.example for details.').links, []);
  assert.deepEqual(analyze('Reference address: support@school.example/claim').links, []);
});
test('Brief neutral text stays unclear and limits still reject oversized messages', () => {
  for (const message of ['hi', 'okay', '', '   ']) assert.equal(analyze(message).verdict, 'unclear');
  assert.throws(() => analyze('a'.repeat(MAX_LENGTH + 1)), RangeError);
});
