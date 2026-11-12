# INX Shield 1.3.0 verification

Prepared 10 November 2026; production verification completed 12 November 2026. Scope: a message flows from the web composer or extension through the local detector to a verdict and optional phrase explanations; wrong-result feedback flows through a local review dialog to copy/download and optional manual public GitHub submission.

## Release status

Published on 10 November 2026 after explicit approval. The public app is live at https://inx-shield.vercel.app/ and the source is at https://github.com/K-IT-TECH/inx-shield.

- Production source commit: `2145d45d5107c99f5787d826fe1389d72a14f5d8`.
- Source tree: `dcf055f8fdeae51d9505c5264dc983be0101db57`, identical to the locally tested source tree.
- Vercel production deployment: `dpl_HzTvYSDTjXRUQ2SRNPMPySimyrhc`, READY, with the public alias `inx-shield.vercel.app`. Status and source commit reconfirmed on 12 November 2026.
- App and extension: `1.3.0`; detector: `rules-1.3.0`. Existing extension users need to download the updated ZIP and reload their unpacked extension.

## Production verification

These checks used synthetic text on the public app. The final documentation update does not change deployed application code.

- 10 November: `Never share OTP with strangers, but do not delay and send your OTP to me.` visibly returned “Likely scam — pause here.” The highlight covered `send your OTP`; the preceding safety advice remained unhighlighted.
- 12 November: `உங்கள் ரகசிய குறியீட்டை சொல்லுங்கள்.` visibly returned a Tamil likely-scam verdict and the secret-code request explanation. The original Tamil text remained intact around the highlighted matched span.
- Feedback opened with no example selected. Including the synthetic Tamil example left copy/download disabled until the review checkbox was selected. Copy then succeeded, and the clipboard contained the reviewed example and `engine_version: rules-1.3.0`.
- The feedback link points to a blank public GitHub issue form. No issue was submitted during verification.
- 12 November: `Your account will not be blocked.` returned “No obvious warning signs,” without a stale warning or highlight from the previous check.
- The browser console scan showed only errors from the browser automation extension, with no app-origin error observed in the inspected logs.

## Changes and examples

| Input or action | Expected behavior |
| --- | --- |
| `Could I have the verification code you received?` | Likely scam; highlight the request |
| `Shre your pasword for the account update.` | Likely scam for explicitly supported spelling variants |
| `Unga OTP ah sollunga please.` | Likely scam; show the matching Tanglish phrase |
| `உங்கள் ரகசிய குறியீட்டை சொல்லுங்கள்.` | Likely scam; preserve Tamil text and offsets |
| `Never share OTP with strangers, but send OTP to me.` | Highlight only the later request |
| `Do not delay and send your OTP to me.` | Still flags the actual secret-code request |
| `OTP share panna vendam.` | No credential-sharing request |
| `Your account will not be blocked.` / `உங்கள் கணக்கு முடக்கப்படாது.` | No account-threat warning |
| `Please send the source code for our college project.` | No credential-sharing warning |
| `Wrong result?` | No example selected; choose feedback type to prepare metadata |
| Include an example | Common identifiers masked; editable, not approved automatically |
| Edit after reviewing | Review checkbox clears; copy/download disabled until reviewed again |
| Close or change the checked message | Feedback draft and stale highlights cleared |
| Open public GitHub issue form | Opens a blank form; no report, message or secrets placed in URL |

These are synthetic development regressions. The original two user examples were never provided. Test totals are not real-world accuracy estimates; no trained model or external reputation service is involved.

## Automated checks

- 144 Node tests pass, including 56 tests added in this release. Existing detector, extension capture, history, share handoff and worker tests remain green.
- Highlights preserve original text after Unicode normalization, dotted initials, zero-width characters and Tamil text; overlapping spans merge without duplicating text. Evidence contains only rule IDs and offsets.
- HTML-like input is rendered through text nodes. History allowlists drop evidence, original text and unexpected fields. Feedback allowlists drop original links, captures and identifiers unless the user explicitly includes an edited example.
- Feedback requires a known type, source, verdict and engine version. Included examples must be nonempty, within 12,000 characters and explicitly reviewed.
- Bundled extension tests exercise click-triggered capture, hidden-link mismatches, translated highlights, feedback copy, review invalidation and draft cleanup. Permissions remain `activeTab` and `scripting`.
- Maximum-length Unicode normalization completes without an offset-array stack overflow; message limits remain unchanged.
- `npm run build`, extension ZIP CRC integrity and `git diff --check` pass. No dependency additions.

## Browser verification

- Desktop web: indirect/mixed-language request visibly returned a likely-scam result. Highlighted `OTP ah sollunga` and `snd your O.T.P.` while leaving preceding safety advice unhighlighted.
- Tamil: a synthetic verification-code request returned a Tamil verdict; optional feedback replaced synthetic digits with `[NUMBER]`.
- Feedback: metadata-only default, type selection, optional example editing, review gating, copy success and actual download event all observed. Clipboard report contained the edited example, not the original. No issue was submitted.
- Responsive: web frame width 390px/content 375px and extension frame width 375px/content 360px showed equal document client/scroll widths. Both dialogs had equal content/client widths and scrollable vertical content.
- Extension popup: its bundled page visibly returned a result and opened the feedback dialog at narrow width. This is not certification of an installed Chrome/Edge popup or a real Gmail session.
- Browser console scan during desktop checks showed only errors from the browser automation extension, with no app-origin error observed.

## Privacy and remaining limits

Checking and feedback preparation remain on-device. Copy/download does not submit feedback. GitHub issues are public and require the user to paste and submit the report themselves. Automatic masking may miss names, addresses or unusual secrets; the included example must be manually reviewed. Feedback is a report, not a verified training label, and does not automatically change the rules.

Existing pilot cloud history, authentication, database schema/RLS and Android sharing behavior were not changed. Physical Android and real installed-extension/Gmail acceptance remain device tests. Public account onboarding still requires email/recovery configuration. A convincing or unfamiliar scam can still be missed.
