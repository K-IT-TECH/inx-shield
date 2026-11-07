import test from 'node:test';
import assert from 'node:assert/strict';
import { createHistoryStore, filterHistory, HISTORY_KEY, normalizeHistory } from '../src/history.js';

const row = (n = 1, extra = {}) => ({
  id: `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`,
  verdict: 'scam', source: 'sms', reason_codes: ['credentials'],
  created_at: new Date(Date.UTC(2026, 0, 1, 0, n)).toISOString(),
  engine_version: 'rules-1.1.0', ...extra
});
function memoryStore(initial = '[]') {
  let data = initial;
  const storage = { getItem(key) { assert.equal(key, HISTORY_KEY); return data; },
    setItem(key, value) { assert.equal(key, HISTORY_KEY); data = value; } };
  return { store: createHistoryStore(() => storage), raw: () => data, storage };
}

test('legacy summaries keep their saved verdict and reason codes without rechecking', () => {
  const legacy = row(1, { id: 'check-mabc123-def456', engine_version: undefined });
  const actual = normalizeHistory([legacy])[0];
  assert.equal(actual.verdict, 'scam');
  assert.deepEqual(actual.reason_codes, ['credentials']);
  assert.ok(!Object.hasOwn(actual, 'engine_version'));
});
test('read and write allow only summary fields, even when old storage has private extras', () => {
  const contaminated = row(1, { message: 'OTP 123456', links: ['https://private.example/token'], email: 'person@example.com' });
  const { store, raw } = memoryStore(JSON.stringify([contaminated]));
  assert.deepEqual(store.read(), [row()]);
  assert.ok(store.write([contaminated]));
  assert.deepEqual(JSON.parse(raw()), [row()]);
  assert.doesNotMatch(raw(), /123456|private\.example|person@example/);
});
test('corrupt records and inherited property names cannot reach the history renderer', () => {
  const invalid = [null, row(2, { verdict: '__proto__' }), row(3, { verdict: 'constructor' }),
    row(4, { source: 'inbox' }), row(5, { reason_codes: ['toString'] }),
    row(6, { created_at: 'yesterday' }), row(8, { verdict: ['scam'] }), row(7, { id: '<script>private text</script>' })];
  assert.deepEqual(normalizeHistory([...invalid, row()]), [row()]);
  assert.deepEqual(normalizeHistory({}), []);
});
test('history keeps the newest 100 unique summaries, with each reason only once', () => {
  const rows = Array.from({ length: 105 }, (_, i) => row(i + 1));
  const actual = normalizeHistory([...rows, row(105), row(105)]);
  assert.equal(actual.length, 100);
  assert.equal(actual[0].id, row(105).id);
  assert.equal(actual.at(-1).id, row(6).id);
  assert.deepEqual(normalizeHistory([row(1, { reason_codes: ['credentials', 'credentials'] })])[0].reason_codes, ['credentials']);
});
test('result and source filters combine without altering the saved or exportable records', () => {
  const rows = [row(), row(2, { source: 'email' }), row(3, { verdict: 'promotion', source: 'email' })];
  const before = structuredClone(rows);
  assert.deepEqual(filterHistory(rows, { verdict: 'scam', source: 'email' }), [rows[1]]);
  assert.deepEqual(filterHistory(rows, { verdict: 'low' }), []);
  assert.deepEqual(filterHistory(rows), rows);
  assert.deepEqual(rows, before);
});
test('removing one summary preserves the others across reloads', () => {
  const { store, raw } = memoryStore(JSON.stringify([row(1), row(2)]));
  assert.ok(store.write(store.read().filter(saved => saved.id !== row(1).id)));
  assert.deepEqual(memoryStore(raw()).store.read(), [row(2)]);
});
test('malformed JSON and unavailable storage leave history usable', () => {
  assert.deepEqual(memoryStore('{invalid').store.read(), []);
  const store = createHistoryStore(() => { throw new Error('blocked'); });
  assert.deepEqual(store.read(), []);
  assert.equal(store.write([row()]), false);
});
test('failed deletion does not overwrite existing saved summaries', () => {
  const { store, storage } = memoryStore(JSON.stringify([row()]));
  storage.setItem = () => { throw new Error('quota'); };
  assert.equal(store.write([]), false);
  assert.deepEqual(store.read(), [row()]);
});
