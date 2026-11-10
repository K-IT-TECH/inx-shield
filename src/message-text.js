// Keep offsets into the original text while normalizing common disguises.
// Only offsets, never copied message fragments, leave the detector.
export function normalizeMessage(input) {
  let text = '';
  let offsets = [];
  for (const part of input.matchAll(/\P{M}\p{M}*|\p{M}+/gu)) {
    const value = part[0].normalize('NFKC').replace(/[\u200B-\u200D\uFEFF]/gu, '').replace(/’/gu, "'");
    text += value;
    for (let i = 0; i < value.length; i++) offsets.push([part.index, part.index + part[0].length]);
  }
  function replace(pattern, replacement) {
    let next = '', map = [], cursor = 0;
    for (const match of text.matchAll(pattern)) {
      next += text.slice(cursor, match.index) + replacement;
      for (let i = cursor; i < match.index; i++) map.push(offsets[i]);
      const span = [offsets[match.index][0], offsets[match.index + match[0].length - 1][1]];
      for (let i = 0; i < replacement.length; i++) map.push(span);
      cursor = match.index + match[0].length;
    }
    next += text.slice(cursor);
    for (let i = cursor; i < offsets.length; i++) map.push(offsets[i]);
    text = next; offsets = map;
  }
  replace(/\b(?:o[.\s_-]+t[.\s_-]*p|ot[.\s_-]+p)\b\.?/giu, 'OTP');
  replace(/\b(?:p[.\s_-]+i[.\s_-]*n|pi[.\s_-]+n)\b\.?/giu, 'PIN');
  replace(/\b(?:c[.\s_-]+v[.\s_-]*v|cv[.\s_-]+v)\b\.?/giu, 'CVV');
  replace(/ஓ[.\s_-]*டி[.\s_-]*பி\.?/gu, 'OTP');
  return { text, offsets };
}

export function messageClauses(text) {
  const clauses = [];
  let start = 0;
  for (const separator of text.matchAll(/[.!?;]+|\b(?:but|however|instead)\b|ஆனால்/giu)) {
    if (separator.index > start) clauses.push({ text: text.slice(start, separator.index), start });
    start = separator.index + separator[0].length;
  }
  if (start < text.length) clauses.push({ text: text.slice(start), start });
  return clauses;
}
