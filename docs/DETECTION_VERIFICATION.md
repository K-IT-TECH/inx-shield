# Detection regression verification — 1.2.1

Verified 8 November 2026. The web app, detector and downloadable extension share the corrected engine.

Production deployment `dpl_FkGmrAUpkGz2srii3uiTqeiyFGfM` is READY at https://inx-shield.vercel.app/ from source commit `2f927b03e2e59814ec710336e3d0a8fc062b930c`. Its tree `a71c55cad9f58c4aeb79494296e5644cf19334e4` matches the locally tested source. Live checks confirmed a visible scam warning for `send OTP`, a low verdict for explicit safety advice, and caution with a hostname for the parcel-fee/domain-path example. The two original user messages remain unverified because their texts have not been supplied.

The reported issue was that two unknown-sender messages were not detected or did not respond. The original texts and exact UI behavior have not been supplied. The following are independently written regression examples, not copies of the user's messages.

| Example | Previous engine | Corrected engine |
| --- | --- | --- |
| `send OTP` | Not enough information | Likely scam; secret-code request |
| `OTP anuppu` | Not enough information | Likely scam; secret-code request |
| `Send PIN` | Not enough information | Likely scam; secret-code request |
| `Please send your O.T.P. to confirm the request.` | No obvious warning signs | Likely scam; secret-code request |
| `Never share your OTP with strangers, but send your OTP to me for verification.` | No obvious warning signs | Likely scam; secret-code request |
| `Pay a registration fee to start this job.` | No obvious warning signs | Some warning signs; fee request |
| `Your parcel is held. Pay a delivery fee at delivery-update.example/claim` | Fee signal, but no link detected and low verdict | Caution; fee signal and hostname shown |

## Verification

- 88 Node tests pass, including 30 added detection cases and 3 bundled-extension cases. Existing history, share-worker, privacy and capture checks still pass.
- Coverage includes short/line-wrapped English, Tamil and Tanglish requests; code obfuscation; genuine safety advice; ordinary messages; fee/threat cautions; domains with paths; email/filename exclusions; original limits; and no private URL paths in analysis output.
- The actual built extension bundle shows a warning for a short pasted OTP request in both UI languages. Injected rendering failures clear stale results and display a retry message; oversized input retains its specific length error. This is bundle execution, not a new physical Gmail installation test.
- The browser checker displayed warnings for `send OTP`, `OTP anuppu`, `OTP அனுப்பு`, dotted OTP wording and advice followed by a request. `Do not, under any circumstances, share your OTP.` remained unflagged. Clearing the input and checking displayed the Tamil empty-input prompt and hid the previous result.
- The production build and extension ZIP CRC check pass. Manifest version is 1.2.1 with only activeTab and scripting permissions.

## Limits and follow-up

These tests establish expected behavior for the listed cases, not a detection accuracy percentage. The engine remains rule-based and can miss unfamiliar wording or flag legitimate requests. Caution is a reason to verify, not proof of a scam. Unknown sender identity alone is not evidence of fraud, and pasted text cannot authenticate a sender.

This release does not add automatic inbox monitoring. A person must paste/share the message and press Check, or use the desktop extension. Existing extension installations must be replaced with the new ZIP and reloaded. Saved history is not re-analyzed because original messages are not stored.

To reproduce the original complaint, obtain the two redacted texts and whether Check showed no result, an error, or an incorrect verdict. No exact-case resolution is claimed yet.
