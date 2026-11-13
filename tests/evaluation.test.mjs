import test from 'node:test';
import assert from 'node:assert/strict';
import { scoreOutcomes } from '../evaluation/metrics.mjs';

test('Evaluation counts misses and false alarms against an independently hand-calculated table', () => {
  const m = scoreOutcomes([
    { label: 'scam', verdict: 'scam' }, { label: 'scam', verdict: 'caution' }, { label: 'scam', verdict: 'low' },
    { label: 'benign', verdict: 'scam' }, { label: 'benign', verdict: 'promotion' },
    { label: 'ambiguous', verdict: 'scam' }, { label: 'ambiguous', verdict: 'low' }
  ]);
  assert.equal(m.total, 7); assert.equal(m.scamWarnings, 2); assert.equal(m.missedScams, 1);
  assert.equal(m.falseAlarms, 1); assert.equal(m.benignWithoutWarning, 1);
  assert.equal(m.warningRecall, 2 / 3); assert.equal(m.warningPrecision, 2 / 3);
  assert.equal(m.falseAlarmRate, 1 / 2); assert.equal(m.likelyScamPrecision, 1 / 2);
});
test('Unclear scam results are misses; unclear benign results are not warnings', () => {
  const m = scoreOutcomes([{ label: 'scam', verdict: 'unclear' }, { label: 'benign', verdict: 'unclear' }]);
  assert.equal(m.missedScams, 1); assert.equal(m.falseAlarms, 0);
  assert.equal(m.warningPrecision, null); assert.equal(m.warningRecall, 0);
});
test('Empty and ambiguous-only evaluations cannot report an invented perfect score', () => {
  for (const rows of [[], [{ label: 'ambiguous', verdict: 'scam' }]]) {
    const m = scoreOutcomes(rows);
    for (const key of ['warningRecall', 'warningPrecision', 'falseAlarmRate', 'likelyScamPrecision']) assert.equal(m[key], null);
  }
});
