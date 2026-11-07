# Saved history verification — web app 1.2.0

Verified 7 November 2026.

**Story:** A person checks a message, explicitly saves its summary on the device, then revisits the recorded reasons and guidance, filters the list, exports all summaries or deletes one check. This path uses browser storage and has no server or account dependency.

| Boundary | Result | Evidence |
| --- | --- | --- |
| Checker → save | Pass | Bank-alert SMS and shopping-offer email samples produced two saved summaries. |
| Storage → reload | Pass | Both summaries survived reload; the message composer was empty. Tamil preference also survived. |
| Summary → explanation | Pass | Saved scam reasons and next steps appeared in English and Tamil. Changing language preserved the open detail and selected filters. |
| Combined filters | Pass | Scam + SMS showed 1 of 2; scam + email showed 0 of 2 with a clear reset path. |
| Export | Pass | The downloaded JSON contained both records while one was filtered. Each record had only id, source, verdict, reason_codes, created_at and engine_version. |
| Individual deletion | Pass | Deleting the saved scam check retained the promotional check across reload. |
| Narrow layout | Pass | Tamil history was checked in a 390px iframe, with 375px content width after the scrollbar. The document had no horizontal overflow. This is a responsive browser check, not physical-device certification. |
| Console | Pass | No app-origin errors in the inspected browser log. Unrelated browser-extension metadata errors were excluded. |
| Automated checks | Pass | 55 Node tests, including 8 history regressions; production build; extension ZIP CRC check. |

History regressions cover legacy records, dropping private extra fields, invalid/prototype keys, duplicate records and reasons, the newest-100 limit, combined filters, single deletion, malformed JSON, blocked storage and failed writes. Cloud summaries share the same renderer; this change did not alter or re-test pilot authentication or database policies.

The web app is 1.2.0. The unchanged detector and extension remain 1.1.0. Message analysis remains rule-based guidance with false positives and false negatives; saved history is not a re-analysis.
