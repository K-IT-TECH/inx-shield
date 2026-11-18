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

| Same 60-case dataset | rules-1.3.0 | rules-1.4.1 | rules-1.5.0 |
| --- | ---: | ---: | ---: |
| Scam scenarios receiving a warning | 21 / 24 | 22 / 24 | 24 / 24 |
| Missed scam scenarios | 3 | 2 | 0 |
| Benign scenarios receiving a warning | 6 / 24 | 6 / 24 | 3 / 24 |
| Ambiguous scenarios, excluded from rates | 12 | 12 | 12 |

Version 1.5.0 warns on the two previously missed indirect Tamil/Tanglish family-impersonation requests. Three explicit school/college office fee reminders no longer receive caution when no remote payment cue or stronger warning is present. All three remaining false alarms are cautions on genuine short-link newsletters: wording cannot establish the hidden destination, so the warning remains. No cases or labels were changed. These are tuned development examples; zero misses here does not establish that unfamiliar scams will be caught.

The unchanged case-file SHA-256 is recorded in both [baseline-1.3.0.json](baseline-1.3.0.json) and [current.json](current.json). [BASELINE_1_3.md](BASELINE_1_3.md) and [RESULTS.md](RESULTS.md) list every miss, false alarm and ambiguous case. To compare another detector checkout, use `node scripts/evaluate.mjs --detector /absolute/path/to/src/detector.js --output /path/to/report.json`.

## Expanded development set — 17 November 2026

An additional [60 scenarios](expanded/cases.json) were authored before changing the 1.4.1 detector, then run and frozen with SHA-256 `84ce7cc7487547d987c65ac52dcc715f8df86a62237fcb6bdf15be5c5015315e`. Each language has eight scam, eight benign and four ambiguous cases. The same implementer wrote and reviewed these cases while developing 1.5.0; they are **not blind, independent or held-out**. They focus on changed-contact stories, colloquial money requests, negation, explicit in-person fees and hostile instructions mixed with office wording.

Run `npm run evaluate:expanded`. The script also accepts `--cases /path/to/cases.json` for a separate dataset. [Expanded baseline](expanded/BASELINE_1_4_1.md) and [current results](expanded/RESULTS.md) retain every outcome.

| Expanded set | rules-1.4.1 | rules-1.5.0 |
| --- | ---: | ---: |
| Scam scenarios receiving a warning | 13 / 24 | 24 / 24 |
| Missed scam scenarios | 11 | 0 |
| Benign scenarios receiving a warning | 12 / 24 | 3 / 24 |
| Ambiguous scenarios, excluded from rates | 12 | 12 |

Both sets contain related templates. Do not pool them into an independent accuracy claim. [baseline-1.4.1.json](baseline-1.4.1.json) preserves the original-set pre-change output; all original and expanded source cases remain byte-for-byte unchanged after their baseline runs.

## Next evaluation work

Collect consented and de-identified examples with enough context to label them, have labels reviewed independently, group related templates to prevent leakage, and freeze a separate evaluation set before changing rules. Report sample size, language mix, uncertainty and mistakes rather than turning this small challenge score into an accuracy badge.
