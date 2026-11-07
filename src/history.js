import { REASONS } from './detector.js';
import { labels } from './i18n.js';

export const HISTORY_KEY = 'inx-shield-history';
export const HISTORY_LIMIT = 100;
const sources = new Set(['sms', 'email', 'whatsapp', 'other']);
const savedId = /^(?:[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}|check-[a-z\d]+-[a-z\d]+)$/i;

// Rebuild records from an allowlist on both read and write. Old or modified
// storage must never smuggle message bodies or link destinations into exports.
export function normalizeHistory(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  const rows = [];
  for (const row of value) {
    if (!row || typeof row.id !== 'string' || !savedId.test(row.id) || seen.has(row.id)
      || typeof row.verdict !== 'string' || !Object.hasOwn(labels, row.verdict) || !sources.has(row.source)
      || typeof row.created_at !== 'string' || !Number.isFinite(Date.parse(row.created_at))
      || !Array.isArray(row.reason_codes)
      || !row.reason_codes.every(code => typeof code === 'string' && Object.hasOwn(REASONS, code))) continue;
    seen.add(row.id);
    const summary = {
      id: row.id,
      source: row.source,
      verdict: row.verdict,
      reason_codes: [...new Set(row.reason_codes)],
      created_at: new Date(row.created_at).toISOString()
    };
    if (typeof row.engine_version === 'string' && /^rules-\d+\.\d+\.\d+$/.test(row.engine_version)) {
      summary.engine_version = row.engine_version;
    }
    rows.push(summary);
  }
  return rows.sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, HISTORY_LIMIT);
}

export function filterHistory(rows, { verdict = '', source = '' } = {}) {
  return rows.filter(row => (!verdict || row.verdict === verdict) && (!source || row.source === source));
}

export function createHistoryStore(getStorage) {
  return {
    read() {
      try { return normalizeHistory(JSON.parse(getStorage().getItem(HISTORY_KEY) || '[]')); }
      catch { return []; }
    },
    write(rows) {
      try { getStorage().setItem(HISTORY_KEY, JSON.stringify(normalizeHistory(rows))); return true; }
      catch { return false; }
    }
  };
}
