// Chrome serializes this function. Keep every dependency inside its body.
export function captureMessage() {
  const visible = el => {
    const style = getComputedStyle(el);
    return el.getBoundingClientRect().height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
  };
  const selection = window.getSelection();
  let text = selection?.toString().trim() || '', anchors = [], kind = 'selection';
  if (text) {
    for (let i = 0; i < selection.rangeCount; i++) {
      const range = selection.getRangeAt(i);
      const node = range.commonAncestorContainer;
      const root = node.nodeType === 1 ? node : node.parentElement;
      if (!root) continue;
      const parentLink = root.closest('a[href]');
      const candidates = [...root.querySelectorAll('a[href]'), ...(parentLink ? [parentLink] : [])];
      anchors.push(...candidates.filter(el => range.intersectsNode(el) && visible(el)));
    }
  } else {
    if (location.hostname !== 'mail.google.com') return {error:'no_message'};
    const bodies = [...document.querySelectorAll('.a3s.aiL')].filter(visible);
    if (bodies.length > 1) return {error:'multiple_messages'};
    if (!bodies.length) return {error:'no_message'};
    text = bodies[0].innerText.trim();
    anchors = [...bodies[0].querySelectorAll('a[href]')].filter(visible);
    kind = 'gmail';
  }
  if (!text) return {error:'no_message'};
  if (text.length > 12000) return {error:'too_long'};
  const links = [];
  for (const anchor of new Set(anchors)) {
    try {
      const url = new URL(anchor.href);
      if (!['http:', 'https:'].includes(url.protocol)) continue;
      const label = (anchor.innerText || anchor.textContent || '').trim();
      const displayedUrl = label.match(/^(?:https?:\/\/|www\.)[^\s<>"']+$/iu)?.[0];
      let shownHost = '';
      if (displayedUrl) {
        try { shownHost = new URL(displayedUrl.startsWith('www.') ? 'https://' + displayedUrl : displayedUrl).hostname; } catch { /* Not a URL label. */ }
      }
      // Drop paths, queries, fragments and credentials before leaving the page.
      const href = url.protocol + '//' + (url.username || url.password ? 'redacted@' : '') + url.host;
      const mismatch = !!shownHost && shownHost.replace(/^www\./i, '') !== url.hostname.replace(/^www\./i, '');
      links.push({href, host:url.hostname, shownHost, mismatch});
      if (links.length > 20) return {error:'too_many_links'};
    } catch { /* Ignore non-web or invalid targets; never follow them. */ }
  }
  return {text, links, kind};
}
