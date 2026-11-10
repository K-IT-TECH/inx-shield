import { REASONS, MAX_LENGTH } from './detector.js';

export const FEEDBACK_TYPES = ['missed_scam', 'false_alarm', 'wrong_category'];
const verdicts = ['scam', 'caution', 'promotion', 'low', 'unclear'];
const sources = ['sms', 'whatsapp', 'email', 'other'];

// An editing aid, not a promise that every identifier or secret is found.
export function redactExample(text) {
  if (typeof text !== 'string' || text.length > MAX_LENGTH) throw new RangeError('Invalid example');
  return text.normalize('NFKC').replace(/[\u200B-\u200D\uFEFF]/gu, '')
    .replace(/(?:https?:\/\/|www\.)[^\s<>"']+|(?<![\p{L}\p{N}_@.-])(?:[a-z\d-]+\.)+[a-z]{2,63}\/[^\s<>"']*/giu, '[LINK]')
    .replace(/[\p{L}\p{N}._%+-]+@[\p{L}\p{N}.-]+/gu, '[EMAIL OR UPI]')
    .replace(/((?:password|passcode|pin|cvv|otp|கடவுச்சொல்|ரகசிய எண்)\s*(?:is|=|:|என்பது)\s*)[^\s,;.!?]+/giu, '$1[SECRET]')
    .replace(/\+?\p{N}(?:[\p{N}\s().-]*\p{N})?/gu, '[NUMBER]')
    .replace(/\b(?=[a-z\d_-]*[a-z])(?=[a-z\d_-]*\d)[a-z\d_-]{6,}\b/giu, '[ID]');
}

export function createFeedbackReport({ result, source, type, includeExample = false, example = '', reviewed = false }) {
  if (!result || !verdicts.includes(result.verdict) || !FEEDBACK_TYPES.includes(type) || !sources.includes(source)
    || !/^rules-\d+\.\d+\.\d+$/.test(result.version)) throw new TypeError('Choose a feedback type');
  if (includeExample && (!reviewed || typeof example !== 'string' || !example.trim() || example.length > MAX_LENGTH)) throw new TypeError('Review the edited example');
  const report = {
    app: 'INX Shield', report_version: 1, feedback_type: type, source,
    observed_verdict: result.verdict,
    reason_codes: [...new Set(result.reasons.filter(id => typeof id === 'string' && Object.hasOwn(REASONS, id)))],
    engine_version: result.version
  };
  if (includeExample) report.reviewed_example = example.trim();
  return report;
}

export function formatFeedback(report) {
  return 'INX Shield — detection feedback\n\n' + JSON.stringify(report, null, 2)
    + '\n\nUser-reported feedback; not a verified label or an automatic detector update.\n';
}

const words = {
  'feedback-open': ['Wrong result?', 'முடிவு தவறாக உள்ளதா?'],
  'feedback-title': ['Help improve this check', 'இந்தச் சோதனையை மேம்படுத்த உதவுங்கள்'],
  'feedback-intro': ['Prepare a report you can review and share. Nothing is sent or saved automatically.', 'நீங்கள் சரிபார்த்துப் பகிர ஒரு report தயாரிக்கலாம். எதுவும் தானாக அனுப்பவோ சேமிக்கவோ படாது.'],
  'feedback-type-label': ['What seems wrong?', 'எது தவறாக உள்ளது?'],
  'feedback-type-empty': ['Choose one', 'ஒன்றைத் தேர்வு செய்யுங்கள்'],
  'feedback-type-missed': ['A scam may have been missed', 'மோசடி கண்டறியப்படாமல் இருக்கலாம்'],
  'feedback-type-false': ['A legitimate message was flagged', 'உண்மையான message-க்கு எச்சரிக்கை வந்தது'],
  'feedback-type-category': ['The message category seems wrong', 'Message வகை தவறாகத் தெரிகிறது'],
  'feedback-include-label': ['Include an edited example (optional)', 'திருத்திய உதாரணத்தைச் சேர் (விருப்பம்)'],
  'feedback-example-label': ['Review and edit the example', 'உதாரணத்தைச் சரிபார்த்துத் திருத்துங்கள்'],
  'feedback-redact-note': ['Common codes, numbers, email addresses and links are masked to help you. Masking can miss details: remove names, addresses and any remaining secrets yourself.', 'பொதுவான code, எண்கள், email, links மறைக்கப்படும். சில தகவல்கள் தவறலாம்: பெயர், முகவரி மற்றும் மீதமுள்ள ரகசியங்களை நீங்களே நீக்குங்கள்.'],
  'feedback-reviewed-label': ['I reviewed this example and removed private details.', 'இந்த உதாரணத்தைச் சரிபார்த்து தனிப்பட்ட தகவல்களை நீக்கிவிட்டேன்.'],
  'feedback-preview-label': ['Report preview', 'Report முன்னோட்டம்'],
  'feedback-download': ['Download report', 'Report பதிவிறக்கு'],
  'feedback-copy': ['Copy report', 'Report நகலெடு'],
  'feedback-github': ['Open public GitHub issue form ↗', 'பொது GitHub புகார் படிவத்தைத் திற ↗'],
  'feedback-share-note': ['To send feedback, copy the report, open GitHub and paste it into a new issue. Check it before submitting: GitHub issues are public. Opening the form does not send your report.', 'Feedback அனுப்ப report-ஐ copy செய்து GitHub-ல் புதிய issue-ல் paste செய்யுங்கள். சமர்ப்பிக்கும் முன் சரிபாருங்கள்: GitHub issues அனைவருக்கும் தெரியும். படிவத்தைத் திறப்பதால் report அனுப்பப்படாது.'],
  'feedback-close': ['Close', 'மூடு']
};

export function connectFeedback({ getContext, language }) {
  const $ = id => document.getElementById(id);
  const dialog = $('feedback-dialog');
  let context = null;
  const t = (en, ta) => language() === 'ta' ? ta : en;
  const say = (en, ta) => { $('feedback-status').textContent = t(en, ta); };
  function reportInput() {
    return { result: context?.result, source: context?.source, type: $('feedback-type').value,
      includeExample: $('feedback-include').checked, example: $('feedback-example').value, reviewed: $('feedback-reviewed').checked };
  }
  function render() {
    const include = $('feedback-include').checked;
    $('feedback-example-fields').hidden = !include;
    $('feedback-status').textContent = '';
    // A visible preview is available before the user's review, but export is gated.
    try {
      const input = reportInput();
      $('feedback-preview').value = formatFeedback(createFeedbackReport({ ...input, reviewed: true }));
      const ready = !include || input.reviewed;
      $('feedback-copy').disabled = !ready;
      $('feedback-download').disabled = !ready;
      if (!ready) say('Review the example and tick the checkbox before copying or downloading.', 'Copy அல்லது download செய்வதற்கு முன் உதாரணத்தைச் சரிபார்த்து checkbox-ஐத் தேர்வு செய்யுங்கள்.');
    } catch {
      $('feedback-preview').value = '';
      $('feedback-copy').disabled = true;
      $('feedback-download').disabled = true;
      say($('feedback-type').value ? 'Add an edited example, or leave it out.' : 'Choose what seems wrong to prepare your report.', $('feedback-type').value ? 'திருத்திய உதாரணத்தைச் சேருங்கள் அல்லது உதாரணம் சேர்க்கும் தேர்வை நீக்குங்கள்.' : 'Report தயாரிக்க எது தவறாக உள்ளது என்பதைத் தேர்வு செய்யுங்கள்.');
    }
  }
  function clear() {
    context = null;
    $('feedback-type').value = '';
    $('feedback-include').checked = false;
    $('feedback-reviewed').checked = false;
    $('feedback-example').value = '';
    $('feedback-preview').value = '';
    $('feedback-status').textContent = '';
    $('feedback-example-fields').hidden = true;
    $('feedback-copy').disabled = true;
    $('feedback-download').disabled = true;
  }
  function translate() {
    for (const [id, pair] of Object.entries(words)) $(id).textContent = pair[language() === 'ta' ? 1 : 0];
    if (context) render();
  }
  function reset() { if (dialog.open) dialog.close(); clear(); }
  $('feedback-open').addEventListener('click', () => {
    clear(); context = getContext();
    if (!context?.result) return;
    translate(); render(); dialog.showModal();
  });
  $('feedback-type').addEventListener('change', render);
  $('feedback-include').addEventListener('change', () => {
    $('feedback-reviewed').checked = false;
    $('feedback-example').value = $('feedback-include').checked ? redactExample(context?.text || '') : '';
    render();
  });
  $('feedback-example').addEventListener('input', () => { $('feedback-reviewed').checked = false; render(); });
  $('feedback-reviewed').addEventListener('change', render);
  $('feedback-close').addEventListener('click', reset);
  dialog.addEventListener('close', clear);
  $('feedback-copy').addEventListener('click', async () => {
    const active = context;
    try {
      const content = formatFeedback(createFeedbackReport(reportInput()));
      await navigator.clipboard.writeText(content);
      if (context === active) say('Report copied. It has not been submitted.', 'Report copy செய்யப்பட்டது. இன்னும் அனுப்பப்படவில்லை.');
    } catch {
      if (context === active) say('Copy is unavailable. Use Download report, or select the preview and copy it yourself.', 'Copy வசதி கிடைக்கவில்லை. Report-ஐ download செய்யுங்கள் அல்லது முன்னோட்டத்தைத் தேர்வு செய்து copy செய்யுங்கள்.');
    }
  });
  $('feedback-download').addEventListener('click', () => {
    try {
      const content = formatFeedback(createFeedbackReport(reportInput()));
      const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url; link.download = 'INX-Shield-feedback.txt'; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      say('Report downloaded. Nothing has been submitted.', 'Report download செய்யப்பட்டது. எதுவும் அனுப்பப்படவில்லை.');
    } catch { say('Review the report before downloading.', 'Download செய்வதற்கு முன் report-ஐச் சரிபாருங்கள்.'); }
  });
  translate(); clear();
  return { reset, translate };
}
