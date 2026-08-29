'use strict';

(function () {
  const replacements = [
    [/Core readiness lane/gi, 'Availability'],
    [/Fail-closed launch controls/gi, 'Availability safeguards'],
    [/Owner workbench/gi, 'Administration'],
    [/provider flags/gi, 'service availability'],
    [/control states/gi, 'availability'],
    [/deployment diagnostics/gi, 'service status'],
    [/Alignment required in the next material version/gi, 'Related community help'],
    [/Required alignment in the next material version/gi, 'Related community help'],
    [/Live state not re-affirmed/gi, 'Check the linked service for current availability'],
    [/Alineaci[oó]n requerida en la pr[oó]xima versi[oó]n material/gi, 'Ayuda comunitaria relacionada'],
    [/Ruta especializada independiente; estado en vivo no reafirmado/gi, 'Ruta especializada; consulte el servicio enlazado para ver la disponibilidad actual'],
    [/estado en vivo no reafirmado/gi, 'consulte el servicio enlazado para ver la disponibilidad actual'],
    [/\bNO_GO\b/g, 'Not available yet'],
    [/\bEn desarrollo\b/gi, 'Más información próximamente']
  ];
  const internalRelease = /\b(?:PRE\d{2,4}|v\d+\.\d+\.\d+(?:-[A-Za-z0-9.-]+)?)\b/gi;
  const internalTimestamp = /\b20\d{2}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,6})?)?(?:Z|[+-]\d{2}:?\d{2})\b/g;

  function scrub(value) {
    let next = String(value || '');
    for (const [pattern, replacement] of replacements) next = next.replace(pattern, replacement);
    next = next.replace(internalRelease, '').replace(internalTimestamp, '');
    return next.replace(/[ \t]{2,}/g, ' ');
  }

  function eligible(node) {
    const parent = node && node.parentElement;
    if (!parent) return false;
    return !/^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA)$/i.test(parent.tagName || '');
  }

  function scrubTree(root) {
    if (!root || typeof document === 'undefined') return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      if (!eligible(node)) continue;
      const next = scrub(node.nodeValue);
      if (next !== node.nodeValue) node.nodeValue = next;
    }
  }

  function start() {
    scrubTree(document.body || document.documentElement);
    const root = document.documentElement;
    if (!root || typeof MutationObserver === 'undefined') return;
    new MutationObserver(records => {
      for (const record of records) {
        if (record.type === 'characterData' && eligible(record.target)) {
          const next = scrub(record.target.nodeValue);
          if (next !== record.target.nodeValue) record.target.nodeValue = next;
          continue;
        }
        for (const node of record.addedNodes || []) {
          if (node.nodeType === Node.TEXT_NODE && eligible(node)) {
            const next = scrub(node.nodeValue);
            if (next !== node.nodeValue) node.nodeValue = next;
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            scrubTree(node);
          }
        }
      }
    }).observe(root, { childList: true, subtree: true, characterData: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
