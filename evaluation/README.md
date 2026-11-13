# Detection evaluation

Run `npm run evaluate` from the repository root. It regenerates [current.json](current.json) and [RESULTS.md](RESULTS.md) using the current detector. `npm test` separately runs code regressions; passing those tests is not an accuracy measurement.

## What this set is

[cases.json](cases.json) contains 60 synthetic, author-labelled scenarios created on 12 November 2026: 20 each in English, Tamil and Tanglish. Each language has eight scam scenarios, eight benign scenarios and four ambiguous scenarios. Labels reflect the described fictional scenario, not verified reports from users. Links use reserved example domains or dummy short-link strings and are never opened.

The cases were written and run against version 1.3.0 before implementing the candidate update. The explicit English money-request rule was then expanded after reviewing that baseline. **This is a development challenge set, not an independent holdout, a representative sample of real messages, or a claim of real-world accuracy.** Future tuning against these examples further makes them regression cases.

No private messages were used. The two messages originally reported as missed were not supplied and are not represented as verified fixes.

## Counting rules

- A warning means either `scam` or `caution`. The primary metric measures whether a warning appeared, not whether a scam was conclusively identified.
- A missed scam is a scenario labelled `scam` with `low`, `promotion` or `unclear` output.
- A false alarm is a scenario labelled `benign` with either `scam` or `caution` output. Conservative warnings on legitimate fee reminders and short links count as false alarms here.
- Ambiguous examples are listed but excluded from recall, precision and false-alarm denominators.
- Warning recall = warned scam scenarios / all scam scenarios. False-alarm rate = warned benign scenarios / all benign scenarios. Warning precision = warned scam scenarios / all warnings on labelled scam or benign scenarios.
- Likely-scam-only precision is reported separately; caution is not treated as a confirmed scam. Empty denominators produce `null` / `n/a`, never a perfect score.
- Evaluation uses text only. Optional context questions supply additional guidance and do not change these text verdicts or the evaluation totals.

## Baseline comparison

| Same 60-case dataset | rules-1.3.0 | rules-1.4.0 |
| --- | ---: | ---: |
| Scam scenarios receiving a warning | 21 / 24 | 22 / 24 |
| Missed scam scenarios | 3 | 2 |
| Benign scenarios receiving a warning | 6 / 24 | 6 / 24 |
| Ambiguous scenarios, excluded from rates | 12 | 12 |

All six current false alarms are cautions: three legitimate fee reminders and three genuine short-link newsletters. Two indirect family-impersonation requests in Tamil/Tanglish remain missed. Context answers can prompt independent verification when a person recognizes a money request, but they do not repair the detector's measured miss.

The unchanged case-file SHA-256 is recorded in both [baseline-1.3.0.json](baseline-1.3.0.json) and [current.json](current.json). [BASELINE_1_3.md](BASELINE_1_3.md) and [RESULTS.md](RESULTS.md) list every miss, false alarm and ambiguous case. To compare another detector checkout, use `node scripts/evaluate.mjs --detector /absolute/path/to/src/detector.js --output /path/to/report.json`.

## Next evaluation work

Collect consented and de-identified examples with enough context to label them, have labels reviewed independently, group related templates to prevent leakage, and freeze a separate evaluation set before changing rules. Report sample size, language mix, uncertainty and mistakes rather than turning this small challenge score into an accuracy badge.
