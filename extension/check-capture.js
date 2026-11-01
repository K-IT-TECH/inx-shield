import {analyze} from '../src/detector.js';

export function checkCapture(text, capture) {
  const links = capture?.links || [];
  const result = analyze(text, {links:links.map(link => link.href)});
  if (links.some(link => link.mismatch)) {
    if (!result.reasons.includes('unusual_link')) result.reasons.push('unusual_link');
    if (['low', 'promotion', 'unclear'].includes(result.verdict)) result.verdict = 'caution';
  }
  return result;
}
