import test from 'node:test';
import assert from 'node:assert/strict';
import {analyze} from '../src/detector.js';

// Independent audit regressions, separate from the frozen evaluation set.
for(const text of [
  'Your account has not been blocked. No action is needed.',
  'Your account has never been closed.',
  'Your account is not being suspended.',
  "Your account hasn't been blocked.",
  "Your card wasn't suspended.",
  'Your account has not yet been blocked.',
  'Your account will not be blocked.',
  'Your account block aagathu.',
  'உங்கள் கணக்கு முடக்கப்படாது.'
])test(`Negated account status stays unflagged: ${text}`,()=>{
  const result=analyze(text,{includeEvidence:true});
  assert.equal(result.verdict,'low');
  assert.ok(!result.reasons.includes('threat'));
  assert.ok(!result.evidence.some(item=>item.id==='threat'));
});

for(const text of [
  'Your account is blocked, not suspended.',
  'Your card will be suspended, not blocked.',
  'Your account has been blocked, not closed.'
])test(`A later denial cannot hide an earlier threat: ${text}`,()=>{
  const result=analyze(text,{includeEvidence:true});
  assert.equal(result.verdict,'caution');
  assert.ok(result.reasons.includes('threat'));
  assert.ok(result.evidence.some(item=>item.id==='threat'));
});

test('Negation does not hide a separate active threat or secret request',()=>{
  const text='Your account has not been blocked, but your card will be suspended.';
  const result=analyze(text,{includeEvidence:true});
  assert.equal(result.verdict,'caution');
  assert.deepEqual(result.evidence.filter(item=>item.id==='threat').map(item=>text.slice(item.start,item.end)),['card will be suspended']);
  const secret=analyze('Your account has not been blocked; send your OTP.');
  assert.equal(secret.verdict,'scam');
  assert.deepEqual(secret.reasons,['credentials']);
});
