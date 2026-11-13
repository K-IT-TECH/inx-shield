# INX Shield 1.4.0 verification

Prepared 12 November 2026. Story: pasted or deliberately captured text flows through the local detector to a verdict, phrase highlights and possible scam-pattern labels; optional context answers add separate next-step guidance. A developer command evaluates the detector against a fixed synthetic dataset.

## Scope and behavior

- Eight possible pattern labels: job/task fees, delivery fees, account threats, prize/lottery claims, easy-money investment offers, remote access, secret codes and generic payment requests. Labels require corresponding warning reasons; a topic mention alone is not sufficient. The labels are descriptions of wording, not authenticated sender identities or confirmed scams.
- Three optional questions: whether the message was expected, whether the sender is recognized, and what sensitive action is requested. Unknown/skip is the default. Secrets/access prompt pause guidance; money, unexpected messages and unrecognized senders prompt independent verification. Familiarity never removes a text warning.
- Guidance is separate from the text verdict. Answers remain in the current page only, survive language switching, and clear when the message/source changes, a new check or capture begins, or Clear answers is selected. History and feedback retain the existing text-check metadata allowlist, without these answers or extra guidance.
- English and Tamil interface coverage is shared by website and extension. The detector additionally recognizes explicit English send/wire/remit/lend money requests, while excluding adjacent negated advice and automatic sender promises. This can still caution on genuine requests.
- No dependencies, analysis API, database schema, permissions or account changes. OCR, QR scanning and practice mode remain later suggestions, outside this update.

## Automated verification

- 175 Node tests pass: 144 existing tests and 31 additional regressions for category explanations, unsupported topic mentions, context safety, privacy, extension state transitions and evaluation arithmetic.
- The full production build and extension ZIP integrity check pass. App/extension version is `1.4.0`; detector is `rules-1.4.0`.
- Reports use the same case-file SHA-256 before and after this update: `486c8ea5c829dd6f7310fb61e8512e66345177020ed5e5a8c671ce70eab2506f`.

## Evaluation evidence

The 60-case synthetic development set contains 24 scam, 24 benign and 12 ambiguous scenarios across English, Tamil and Tanglish. Ambiguous cases are excluded from rates. Either a scam or caution verdict counts as a warning.

| Measure on the same synthetic set | 1.3.0 | 1.4.0 |
| --- | ---: | ---: |
| Scam scenarios with a warning | 21 / 24 | 22 / 24 |
| Missed scam scenarios | 3 | 2 |
| Benign scenarios receiving a warning | 6 / 24 | 6 / 24 |

Two indirect family-impersonation money requests in Tamil/Tanglish remain missed. All six false alarms are cautions on genuine fee reminders or short-link newsletters. Context guidance is not counted as a corrected text result. The baseline informed development, so this is not an independent holdout or a real-world accuracy estimate. See [methodology](../evaluation/README.md) and [case-level results](../evaluation/RESULTS.md).

## Browser verification

- Web: a synthetic job-fee plus OTP message returned likely scam, job/task fee and secret-code labels. Selecting expected, recognized sender and code sharing kept the original scam verdict and added pause guidance.
- Language switching preserved answers and translated categories and advice into Tamil. Editing the message cleared old answers, category labels and advice. Changing source reset the current result and closed the context disclosure.
- A weak Tanglish message with no matched text warning gained explicit verification advice after selecting a money request and an unrecognized sender; its text verdict remained separate.
- Responsive frames: a 390px web frame had 375px client/scroll width; a 375px extension frame had 360px client/scroll width. Expanded context panels also had matching client/scroll widths (287px web and 318px extension), without horizontal overflow.
- Extension bundled popup: delivery-fee text returned caution and a delivery-fee label; optional money-request guidance displayed and translated into Tamil. This is browser QA of the bundled popup page, not a real installed-extension/Gmail acceptance test.
- No application-origin warnings or errors were present in the inspected browser logs. Browser automation extension messages were excluded.

## Publication

Local verification is complete. Production source and deployment identifiers will be recorded after the authorized GitHub publication and deployment.

## Remaining limits

The detector remains rule-based, cannot authenticate senders, and can miss convincing or unfamiliar scams. Category topics can be ambiguous. Context answers are self-reported, never a safety guarantee. The two originally reported messages have not been supplied. Physical Android sharing, a real installed extension/Gmail session and pilot account onboarding remain separate device/account checks.
