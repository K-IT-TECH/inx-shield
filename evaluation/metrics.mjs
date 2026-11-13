// Ambiguous cases are intentionally not treated as benign or as scams.
export function scoreOutcomes(rows) {
  const scams = rows.filter(r => r.label === 'scam'), benign = rows.filter(r => r.label === 'benign');
  const warns = row => ['scam', 'caution'].includes(row.verdict);
  const caught = scams.filter(warns).length, alarms = benign.filter(warns).length;
  const likely = rows.filter(r => r.label !== 'ambiguous' && r.verdict === 'scam');
  return { total: rows.length, scams: scams.length, benign: benign.length,
    ambiguous: rows.filter(r => r.label === 'ambiguous').length,
    scamWarnings: caught, missedScams: scams.length - caught, falseAlarms: alarms, benignWithoutWarning: benign.length - alarms,
    warningRecall: scams.length ? caught / scams.length : null,
    falseAlarmRate: benign.length ? alarms / benign.length : null,
    warningPrecision: caught + alarms ? caught / (caught + alarms) : null,
    likelyScamPrecision: likely.length ? likely.filter(r => r.label === 'scam').length / likely.length : null };
}
