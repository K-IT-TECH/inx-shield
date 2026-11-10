import { REASONS } from './detector.js';

// Merge overlapping offsets so a phrase is not repeated in the displayed text.
export function evidenceSegments(text, evidence = []) {
  const valid = evidence.filter(span => span && Object.hasOwn(REASONS, span.id)
    && Number.isInteger(span.start) && Number.isInteger(span.end)
    && span.start >= 0 && span.end > span.start && span.end <= text.length)
    .sort((a, b) => a.start - b.start || a.end - b.end);
  const ranges = [];
  for (const span of valid) {
    const last = ranges.at(-1);
    if (last && span.start < last.end) {
      last.end = Math.max(last.end, span.end);
      if (!last.ids.includes(span.id)) last.ids.push(span.id);
    } else ranges.push({ start: span.start, end: span.end, ids: [span.id] });
  }
  const parts = [];
  let cursor = 0;
  for (const range of ranges) {
    if (range.start > cursor) parts.push({ text: text.slice(cursor, range.start), ids: [] });
    parts.push({ text: text.slice(range.start, range.end), ids: range.ids });
    cursor = range.end;
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor), ids: [] });
  return parts;
}

export function renderEvidence(container, explanation, text, evidence, lang = 'en') {
  container.replaceChildren();
  explanation.textContent = '';
  for (const part of evidenceSegments(text, evidence)) {
    const node = document.createElement(part.ids.length ? 'button' : 'span');
    node.textContent = part.text;
    if (part.ids.length) {
      node.type = 'button';
      node.className = 'evidence-mark';
      const reason = part.ids.map(id => REASONS[id][lang === 'ta' ? 1 : 0]).join(' · ');
      node.title = reason;
      node.setAttribute('aria-label', `${part.text} — ${reason}`);
      node.addEventListener('click', () => { explanation.textContent = reason; });
    }
    container.append(node);
  }
}
