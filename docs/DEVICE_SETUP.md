# Connect your messages to INX Shield

Live app: https://inx-shield.vercel.app/

No account is needed to check a message. This is a guide to warning signs; it cannot prove a sender is genuine or guarantee that a message is safe.

## Gmail on your Windows laptop

1. Open the live site → **Connect → Download extension** (version 1.1.0).
2. In File Explorer, right-click the downloaded ZIP → **Extract All**. Keep the extracted folder.
3. In Chrome open `chrome://extensions`; in Edge open `edge://extensions`.
4. Turn on **Developer mode** → **Load unpacked** → select the folder containing `manifest.json`.
5. Pin **INX Shield** from the browser's Extensions menu.
6. Open an email. Select the message text you want checked, then click INX Shield → **Use selected text / opened Gmail message**.
7. Review the captured text and **Link destinations**. Click **Check message**.

**What to expect:** the result explains warning signs and a next step in English or Tamil. A visible address that differs from the underlying link is a reason to verify independently; tracking links can also cause a mismatch. Link names are shown as text and never opened. Editing captured text removes hidden-link context, with a notice. Several expanded emails, overly long text or too many links require a smaller selection.

**Update an existing installation:** download the new ZIP, replace the old extracted files, open the Extensions page and click **Reload** for INX Shield. Check the extension details show **1.1.0**. If you choose a new folder, remove the old installation before using Load unpacked so there is only one copy.

**தமிழில்:** ZIP-ஐ Extract All செய்யுங்கள் → Chrome/Edge Extensions page-ல் Developer mode → Load unpacked → `manifest.json` உள்ள folder. Gmail message-ஐ select செய்து INX Shield-ஐ click செய்யுங்கள் → text-ஐ எடு → சரிபார். பழைய extension இருந்தால் புதிய files-ஐ மாற்றி Reload அழுத்துங்கள்.

This is an unpacked developer preview, not an extension-store release. It reads only when you click, using temporary `activeTab` access; it does not sign into Gmail, use Gmail OAuth, read the entire inbox or send emails.

## SMS / WhatsApp on Android

1. Open the live site in Chrome.
2. Choose **Install app** or **Add to Home screen** from Chrome's menu. Open the installed Shield app once.
3. In **Connect**, use **Try sharing with a safe sample**. The sample should arrive in the message field. Press **Check**.
4. In a messaging app that supports sharing, select a harmless test message → **Share → INX Shield**.
5. Confirm the full text arrived. Review it and press **Check** yourself.

Some messaging apps offer only Copy; copy/paste works. If Shield is absent from Share, confirm the app is installed and opened once. If a shared message expires, share it again or paste it. Do not use real OTPs, passwords, payment details or account numbers in tests.

**தமிழில்:** Chrome-ல் site திறந்து Install app செய்யுங்கள். Installed app-ஐ ஒருமுறை திறக்கவும். Messaging app-ல் text select → Share → INX Shield. Message முழுவதும் வந்ததா பாருங்கள் → சரிபார். Share வசதி இல்லை என்றால் copy–paste செய்யலாம்.

The sample button checks the web handoff only. It does not prove that a particular phone's operating-system Share menu works. Shared messages remain in temporary worker memory for up to one minute and disappear after retrieval; browser suspension can require sharing again.

## iPhone

Use copy/paste. Safari → Share → Add to Home Screen creates a shortcut, but this version does not provide automatic SMS filtering.

## Acceptance checks for your device

| Check | Expected result |
| --- | --- |
| Harmless dinner message | No obvious warning signs, with a reminder that this is not a safety guarantee |
| Synthetic request to share an OTP (no real OTP) | Likely scam, a reason and clear next step |
| Change to தமிழ் | Result and explanation switch language; website remembers the preference |
| Email text linking to a different displayed web address | Destination shown and caution explanation; link is not opened |
| Two expanded Gmail messages without selection | Ask you to select the exact message |
| Android Share after installation | Full text arrives; only you trigger the check |
| Internet off after initial load | Local checker loads; cloud history needs internet |
| Close the extension and reopen | Prior captured email text is gone |

Record browser/device version and pass/fail without copying private messages into bug reports. Automated tests use synthetic fixtures; physical Android and real Gmail installation still need these checks.

## Optional cloud history

Device history works for everyone. Cloud sign-in currently requires an existing pilot account. Public registration and password recovery still need a verified email provider configured by the project owner. Never paste SMTP passwords or API secrets into chat or GitHub.
