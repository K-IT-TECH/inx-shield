import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { redactExample, createFeedbackReport, formatFeedback } from '../src/feedback.js';
import { analyze, MAX_LENGTH } from '../src/detector.js';
const result = analyze('Send your OTP to https://example.test/private?token=not-for-export', { includeEvidence: true });
const input = { result, source: 'sms', type: 'missed_scam' };

test('Metadata-only feedback drops message, evidence, links, user IDs and unexpected fields', () => {
  const report = createFeedbackReport({ ...input, example: 'DO NOT EXPORT', text: 'secret', result: { ...result, user_id: 'private' } });
  assert.deepEqual(Object.keys(report), ['app', 'report_version', 'feedback_type', 'source', 'observed_verdict', 'reason_codes', 'engine_version']);
  assert.doesNotMatch(formatFeedback(report), /DO NOT EXPORT|private|example.test|not-for-export|user_id|evidence/);
});
test('Examples require explicit inclusion and review; export uses exactly the edited example', () => {
  assert.throws(() => createFeedbackReport({ ...input, includeExample: true, example: 'Edited message' }), TypeError);
  const report = createFeedbackReport({ ...input, includeExample: true, reviewed: true, example: 'Send OTP [NUMBER]' });
  assert.equal(report.reviewed_example, 'Send OTP [NUMBER]');
  assert.doesNotMatch(JSON.stringify(report), /example.test/);
});
test('Redaction masks common numeric and text secrets, contact details and complete URLs', () => {
  const redacted = redactExample('OTP: １２３４５６. Password: tree#Blue9. Call +91 98765 43210 or mail alice@example.test. UPI alice@bank. See https://example.test/private?token=abCD123 and site.test/secret. Code ௧௨௩௪.');
  assert.doesNotMatch(redacted, /１２３４５６|tree#Blue9|98765|43210|alice|example.test|private|abCD123|site.test|secret|௧௨௩௪/);
  assert.match(redacted, /\[SECRET\]/);
  assert.match(redacted, /\[LINK\]/);
  assert.match(redacted, /\[EMAIL OR UPI\]/);
});
test('Redaction preserves explanation words and does not claim to remove names', () => {
  const redacted = redactExample('Hello Kavin, send OTP 123456 immediately.');
  assert.match(redacted, /Hello Kavin, send OTP \[NUMBER\] immediately/);
});
test('Unreviewed, empty, oversized or invalid reports cannot be exported', () => {
  for (const type of ['', 'toString', 'invented']) assert.throws(() => createFeedbackReport({ ...input, type }));
  for (const example of ['', ' ', 'x'.repeat(MAX_LENGTH + 1)]) assert.throws(() => createFeedbackReport({ ...input, includeExample: true, reviewed: true, example }));
  assert.throws(() => createFeedbackReport({ ...input, source: 'private-phone' }));
  assert.throws(() => createFeedbackReport({ ...input, result: { ...result, version: 'private-secret' } }));
});
test('Website and extension feedback links open a blank form, never include reports in a URL', async () => {
  for (const filename of ['public/index.html', 'extension/popup.html']) {
    const html = await readFile(filename, 'utf8');
    assert.match(html, /id="feedback-github" href="https:\/\/github.com\/K-IT-TECH\/inx-shield\/issues\/new" target="_blank" rel="noopener noreferrer"/);
    assert.equal((html.match(/id="feedback-dialog"/g) || []).length, 1);
    assert.match(html, /id="feedback-include" type="checkbox">/);
  }
});
