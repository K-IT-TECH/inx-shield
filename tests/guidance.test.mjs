import test from 'node:test';
import assert from 'node:assert/strict';
import { analyze } from '../src/detector.js';
import { classifyPatterns, normalizeContext, assessContext, CATEGORIES, CONTEXT_MESSAGES } from '../src/guidance.js';
import { normalizeHistory } from '../src/history.js';
import { createFeedbackReport } from '../src/feedback.js';

for (const [message, category] of [
  ['Pay an application fee to secure this job.', 'job'],
  ['Work from home task available. Deposit kattunga.', 'job'],
  ['வேலை உறுதி. முன்பணம் அனுப்புங்கள்.', 'job'],
  ['Your shipment is held. Pay the delivery charge.', 'delivery'],
  ['பார்சல் பெற கட்டணம் செலுத்துங்கள்.', 'delivery'],
  ['Your card will be suspended tonight.', 'account'],
  ['உங்கள் கணக்கு முடக்கப்படும்.', 'account'],
  ['Claim your prize from the lottery.', 'prize'],
  ['Invest now: guaranteed profits and double your money.', 'investment'],
  ['முதலீடு: பணம் இரட்டிப்பு உறுதி.', 'investment'],
  ['Bank support asks you to install TeamViewer.', 'remote'],
  ['Could we have your login code?', 'credentials'],
  ['Wire cash to this person for the order.', 'payment']
]) test(`Pattern explanation: ${category} / ${message}`, () => {
  const result = analyze(message, { includeEvidence: true });
  assert.ok(classifyPatterns(message, result).includes(category));
  assert.ok(!classifyPatterns(message, result).includes('__proto__'));
});

for (const message of [
  'Our job interview is tomorrow. There is no registration fee.',
  'The delivery arrived at the front desk.',
  'உங்கள் கணக்கு முடக்கப்படாது.',
  'Never send money to claim a job.',
  'OTP share panna vendam.',
  'Weekly sale: 10% off electronics.'
]) test(`No unsupported scam category: ${message}`, () => {
  assert.deepEqual(classifyPatterns(message, analyze(message)), []);
});

test('Category output is bounded IDs only, even with hostile or oversized input', () => {
  const input = '<img src=x onerror=alert(1)> Send your password to this job agent.';
  const result = analyze(input, { includeEvidence: true });
  const categories = classifyPatterns(input, result);
  assert.deepEqual(categories, ['credentials']);
  assert.ok(!JSON.stringify(categories).includes('onerror'));
  assert.deepEqual(classifyPatterns('x'.repeat(12001), result), []);
  assert.deepEqual(classifyPatterns(null, result), []);
  assert.deepEqual(classifyPatterns('job', null), []);
  assert.ok(Object.values(CATEGORIES).every(v => v.label.length === 2 && v.detail.every(Boolean)));
});

test('Unknown context stays unanswered and arbitrary fields cannot affect advice', () => {
  assert.deepEqual(normalizeContext({ expected: 'safe', sender: '<script>', request: 'toString', password: 'PRIVATE' }), { expected: 'unknown', sender: 'unknown', request: 'unknown' });
  assert.deepEqual(assessContext(null), { answered: false, level: 'neutral', ids: [] });
  assert.ok(!JSON.stringify(assessContext({ password: 'PRIVATE' })).includes('PRIVATE'));
});
test('Secret or remote access requests require pause even when expected and familiar', () => {
  for (const request of ['secret', 'access']) for (const expected of ['yes', 'no', 'unknown']) for (const sender of ['known', 'unrecognized', 'unknown']) {
    const advice = assessContext({ expected, sender, request });
    assert.equal(advice.level, 'pause');
    assert.ok(advice.ids.includes(request));
  }
});
test('Self-reported money requests get verification guidance even when the text missed them', () => {
  const result = analyze('Amma, new phone. Enaku help venum.');
  assert.equal(result.verdict, 'low');
  assert.equal(assessContext({ request: 'money', sender: 'unrecognized' }).level, 'verify');
  assert.equal(result.verdict, 'low');
});
test('Familiar sender and no reported sensitive action are never a safety verdict', () => {
  const result = analyze('Send your OTP to me now.');
  const before = JSON.stringify(result);
  const advice = assessContext({ expected: 'yes', sender: 'known', request: 'none' });
  assert.ok(advice.ids.includes('familiar'));
  assert.ok(advice.ids.includes('none'));
  assert.equal(JSON.stringify(result), before);
  assert.equal(result.verdict, 'scam');
  assert.ok(advice.ids.every(id => CONTEXT_MESSAGES[id]?.every(Boolean)));
});
test('Context answers and pattern labels cannot enter history or default feedback', () => {
  const message = 'Send cash to claim a job.';
  const result = analyze(message);
  const extras = { context: { sender: 'unrecognized', request: 'money' }, categories: classifyPatterns(message, result), text: message };
  const [saved] = normalizeHistory([{ id: 'check-context-private', source: 'sms', verdict: result.verdict, reason_codes: result.reasons, engine_version: result.version, created_at: '2026-11-12T10:00:00Z', ...extras }]);
  const report = createFeedbackReport({ result: { ...result, ...extras }, source: 'sms', type: 'false_alarm', ...extras });
  for (const output of [saved, report]) assert.doesNotMatch(JSON.stringify(output), /unrecognized|"categories"|"context"|Send cash/);
});
test('Direct money requests warn; promises and negated advice do not', () => {
  for (const message of ['Please send cash for the booking.', 'Can you lend some money to my friend?', 'Wire funds to reserve your place.']) {
    const result = analyze(message, { includeEvidence: true });
    assert.equal(result.verdict, 'caution');
    assert.ok(result.evidence.some(span => span.id === 'payment'));
  }
  for (const message of ['We will send money after you collect the receipt.', 'Never send cash to an unknown caller.', 'Do not wire funds to claim a prize.']) assert.ok(!analyze(message).reasons.includes('payment'));
});
