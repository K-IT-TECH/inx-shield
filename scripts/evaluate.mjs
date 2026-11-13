import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { scoreOutcomes as metrics } from '../evaluation/metrics.mjs';

const args = process.argv.slice(2);
const options = {};
for (let i = 0; i < args.length; i += 2) {
  if (!['--detector', '--output', '--markdown'].includes(args[i]) || !args[i + 1]) throw new Error('Use --detector, --output or --markdown with a path');
  options[args[i]] = args[i + 1];
}
const { analyze, ENGINE_VERSION } = await import(pathToFileURL(resolve(options['--detector'] || 'src/detector.js')));
const raw = await readFile(new URL('../evaluation/cases.json', import.meta.url), 'utf8');
const dataset = JSON.parse(raw);
const ids = new Set();
const outcomes = dataset.cases.map(row => {
  if (!row.id || ids.has(row.id) || !['en', 'ta', 'tanglish'].includes(row.language)
    || !['scam', 'benign', 'ambiguous'].includes(row.label) || typeof row.text !== 'string' || !row.rationale) throw new Error('Invalid evaluation row: ' + row.id);
  ids.add(row.id);
  const result = analyze(row.text);
  if (!['scam', 'caution', 'low', 'promotion', 'unclear'].includes(result.verdict)) throw new Error('Invalid verdict: ' + row.id);
  return { ...row, verdict: result.verdict, warning: ['scam', 'caution'].includes(result.verdict), reasons: result.reasons };
});
const report = {
  dataset: dataset.name, datasetSha256: createHash('sha256').update(raw).digest('hex'), engine: ENGINE_VERSION,
  provenance: dataset.provenance,
  interpretation: 'Synthetic, author-labelled development challenge set; not a held-out or independently validated real-world accuracy estimate. A warning means scam OR caution. Ambiguous examples are excluded from precision/recall and false-alarm rates. Context answers are not used.',
  overall: metrics(outcomes), byLanguage: Object.fromEntries(['en', 'ta', 'tanglish'].map(lang => [lang, metrics(outcomes.filter(r => r.language === lang))])),
  outcomes
};
if (options['--output']) { await mkdir(dirname(resolve(options['--output'])), { recursive: true }); await writeFile(options['--output'], JSON.stringify(report, null, 2) + '\n'); }
if (options['--markdown']) {
  const pct = value => value === null ? 'n/a' : (value * 100).toFixed(1) + '%';
  const lines = ['# Detection challenge results', '', `Engine: \`${ENGINE_VERSION}\`. Dataset: ${dataset.name}.`, '', report.interpretation, '',
    `Dataset SHA-256: \`${report.datasetSha256}\``, '',
    '| Group | Scam warnings / scams | Missed scams | False alarms / benign | Warning recall | False-alarm rate |',
    '| --- | ---: | ---: | ---: | ---: | ---: |'];
  for (const [name, m] of Object.entries({ overall: report.overall, ...report.byLanguage })) lines.push(`| ${name} | ${m.scamWarnings}/${m.scams} | ${m.missedScams} | ${m.falseAlarms}/${m.benign} | ${pct(m.warningRecall)} | ${pct(m.falseAlarmRate)} |`);
  lines.push('', `Warning precision: ${pct(report.overall.warningPrecision)}. Likely-scam-only precision: ${pct(report.overall.likelyScamPrecision)}. These describe only the labelled synthetic cases.`, '');
  for (const [title, rows] of [
    ['Missed scam examples', outcomes.filter(r => r.label === 'scam' && !r.warning)],
    ['False alarms', outcomes.filter(r => r.label === 'benign' && r.warning)],
    ['Ambiguous examples (not scored)', outcomes.filter(r => r.label === 'ambiguous')]
  ]) {
    lines.push('## ' + title, '');
    if (!rows.length) lines.push('None in this set.', '');
    for (const row of rows) lines.push(`- **${row.id}** (${row.language}; ${row.verdict}): ${row.text}`, `  - Label rationale: ${row.rationale}`, '');
  }
  await mkdir(dirname(resolve(options['--markdown'])), { recursive: true });
  await writeFile(options['--markdown'], lines.join('\n').trimEnd() + '\n');
}
console.log(JSON.stringify({ engine: report.engine, datasetSha256: report.datasetSha256, overall: report.overall, byLanguage: report.byLanguage }, null, 2));
