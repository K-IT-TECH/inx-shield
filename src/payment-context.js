// Narrow contextual rules for normalized text. No sender identity is verified.
const changedContact = /\b(?:(?:new|replacement|changed|pudhu|puthu|pudhiya|puthiya) (?:mobile |phone )?(?:number|no)|(?:old |my )?(?:phone|handset|mobile).{0,18}?(?:broken|broke|lost|damaged|damage|tholainjuruchu)|(?:lost|broke|damaged) (?:my |the )?(?:phone|handset|mobile))\b|(?:புதிய|புது)\s*(?:தொலைபேசி\s*)?(?:எண்|நம்பர்)|(?:பழைய\s*)?(?:போன்|மொபைல்).{0,18}?(?:உடைந்த|தொலைந்த)/iu;
const money = /\b(?:money|cash|funds|panam|kaasu|kasu)\b|பணம்|பணத்தை|காசு/giu;

export const indirectPayment = /\b(?:i|we)\s+(?:really\s+)?need\s+(?:(?:some|a little|a bit of|urgent|your)\s+){0,2}(?:money|cash|funds)\b|\b(?:money|cash|funds|panam|kaasu|kasu)\s+(?:(?:konjam|romba)\s+)?(?:venum|venumnga|thevai|thaevai)\b|(?:பணம்|காசு)\s*(?:கொஞ்சம்\s*)?(?:வேண்டும்|வேணும்|தேவை)/iu;
export const helpPayment = /\bhelp\s+(?:me|us)\s+(?:out\s+)?(?:with\s+)?(?:(?:some|a little|a bit of)\s+)?(?:money|cash|funds)\b/iu;

function nearby(text, index, length) {
  // Stop at blank paragraphs and bound the context: unrelated distant text
  // must not turn a personal money statement into a request.
  const before = text.slice(Math.max(0, index - 220), index).split(/\n\s*\n/u).at(-1);
  const after = text.slice(index + length, index + length + 140).split(/\n\s*\n/u)[0];
  return before + text.slice(index, index + length) + after;
}

export function hasIndirectPaymentContext(text, index, length) {
  const context = nearby(text, index, length);
  return changedContact.test(context)
    || /\b(?:please help|help (?:me|us|pannunga|pannu))\b|உதவி\s*(?:பண்ணு|செய்யு|செய்)/iu.test(context);
}

export function hasChangedContactPayment(text) {
  for (const match of text.matchAll(money)) {
    if (changedContact.test(nearby(text, match.index, match[0].length))) return true;
  }
  return false;
}

export function isInPersonFeeReminder(clause, match, message, hasLinks) {
  if (hasLinks || !/\bfees?\b|கட்டண/iu.test(match[0])) return false;
  if (changedContact.test(message) || /\b(?:online|upi|qr|crypto|wallet|gift cards?|bank account|personal account)\b|இணைப்பு|வங்கிக்?\s*கணக்கி/iu.test(message)) return false;
  const context = clause.slice(Math.max(0, match.index - 85), match.index + match[0].length + 100);
  if (!/\b(?:school|college|university|campus).{0,65}?\b(?:office|counter|cashier)\b|(?:பள்ளி|கல்லூரி|பல்கலைக்கழக).{0,30}?(?:அலுவலக|கவுண்ட)/iu.test(context)) return false;
  if (!/\b(?:at|visit)\s+(?:the\s+)?(?:school|college|university|campus)\s+(?:office|counter|cashier)\b|\b(?:office(?:\s+counter)?|counter|cashier)\s+(?:la|ku|kku)\b|(?:பள்ளி|கல்லூரி|பல்கலைக்கழக)\s+(?:அலுவலகத்தில்|அலுவலகத்துக்கு|கவுண்டரில்)/iu.test(context)) return false;
  // An office name is not a whitelist. Remote actions, a negated location,
  // or a high-risk purpose keep the normal payment warning.
  return !/\b(?:online|link|upi|bank|account|qr|crypto|wallet|gift cards?|deposit|advance|processing|release|registration|job|prize|lottery|personal|send|transfer|wire|remit|not|never|don't|dont|without|vara vendam)\b|அனுப்பு|இணைப்பு|கணக்கி|முன்பணம்|வேலை|பரிசு|வர\s*வேண்டாம்|அல்ல|கூடாது/iu.test(clause);
}
