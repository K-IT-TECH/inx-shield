# INX Shield

A clean, accessible English/Tamil message checker. People can paste a suspicious message, understand the warning signs and decide what to do next. **No account is needed for checking.**

## What works

- Real local analysis of arbitrary text with explainable English, Tamil and some Tanglish rules. Five results: likely scam, caution, promotional, no obvious warning signs, insufficient context.
- Accessible responsive interface, keyboard navigation, screen-reader labels, reduced-motion support, read aloud when the device has a suitable voice, and practical help.
- Optional device history and JSON export. Saves only verdict, source, time and rule IDs; never message bodies, OTPs, email addresses, phone numbers or links.
- Installable offline PWA. Android Chrome can share selected text from a compatible messaging app into Shield. Review the shared message and press Check.
- Chrome/Edge extension: selected text first, or the last visible opened Gmail message. Captures only on button press using `activeTab` and `scripting`, with no persistent host permissions. Capture can vary as Gmail changes; paste is always available.
- Supabase/PostgreSQL table and authenticated private cloud history for existing pilot accounts, protected by ownership RLS. Public registration is deliberately not offered until email delivery and account recovery are configured.

## Run

Requires Node 22 or later.

```sh
npm ci
npm test
npm run build
```

Serve `dist/` with a static server for development. Vercel uses the checked-in build configuration. `api/share.js` provides a no-body-processing fallback if a share bypasses the installed worker.

## Phone integration

Android Chrome: install from the browser menu, open the installed app once, select a message in an app that supports sharing, choose Share → INX Shield. Not all SMS apps expose Share; copy/paste is the fallback. The service worker keeps a shared message in memory for up to 60 seconds, removes it when read, and puts only a random ID in the redirect URL. If the worker is stopped, the user is asked to share again. Do not send actual secrets.

iOS: add to Home Screen if desired; use copy/paste. **This is not a native SMS inbox reader.** Automatic filtering needs a separate native app, OS permissions and applicable store approval. WebOTP is not a general SMS-reading API.

## Gmail integration

Build, then unzip `dist/inx-shield-extension.zip`. In `chrome://extensions` or `edge://extensions`, enable Developer mode and choose Load unpacked. Select the extracted folder. Open an email, select its text, click INX Shield, then Use selected text. Review the captured text and check it. This developer preview is not yet submitted to the Chrome/Edge stores. Chrome extension code is local and makes no network requests. It does not connect to Gmail OAuth or automatically scan all mail.

## Database and privacy

Project: `zdjdjsqpoatmoilmiiti` (Mumbai), organization K-IT-TECH’s Org. The schema source is `supabase/scan_summaries.sql`; deployed migration name `private_scan_summaries`. Explicit grants allow authenticated users only SELECT, INSERT and DELETE. Ownership policies use `(select auth.uid()) = user_id`. No UPDATE, anonymous access or privileged RPC is exposed. Index `(user_id, created_at desc)` supports private history queries.

`src/config.js` contains only a **publishable** key. The secret/service role key must never be added to this repository or a browser bundle. Cloud auth persists only in session storage. Public email signups require a verified email provider and correct site/redirect configuration; Supabase’s built-in email service is restricted. Create pilot users through your project's approved Auth setup, never by storing passwords in SQL. Public registration, password recovery and cross-device account onboarding remain rollout work.

The app does not upload messages for analysis. Only an explicit Save to cloud action sends summary metadata to Supabase. Hosting providers still see ordinary page requests and IP addresses. There are no analytics scripts. The extension has no cloud history. Offline works after a successful initial load; sign-in/cloud features require internet.

## Detector limits

This is an **explainable rule-based detector**, not a trained machine-learning model. No accuracy or confidence percentage is claimed. It cannot authenticate senders, inspect attachments, check domain reputation, follow redirects, understand every language or interpret the entire conversation. English and Tamil coverage is a starting point, with false positives and false negatives. “No obvious warning signs” never means “safe.” A validated ML model and reputation API can be added later with separate evaluation and explicit data consent.

## Verification

`npm test` covers arbitrary messages, bilingual samples, negation, benign links, unsafe URL forms, Unicode obfuscation, input limits and privacy of outputs. Build creates the website, PWA assets and extension ZIP without external CDN dependencies. See `CHECKPOINT.md` for deployment, database checks and outstanding physical-device tests.

The earlier inline mockup was not present in the resumed workspace. This repository contains the implemented version of that design; it does not claim to contain an exact archival copy of the lost preview file.

## Official integration references

- [Chrome activeTab](https://developer.chrome.com/docs/extensions/develop/concepts/activeTab)
- [Web Share Target](https://developer.chrome.com/docs/capabilities/web-apis/web-share-target)
- [Android SMS permission policy](https://support.google.com/googleplay/android-developer/answer/10208820)
- [Supabase row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [India cybercrime reporting](https://cybercrime.gov.in/)

Built for Kavin RB / K-IT-TECH.
