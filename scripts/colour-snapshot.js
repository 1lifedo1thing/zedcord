// computed colours of every visible element, for proving a token refactor leaves a theme unchanged. read-only:
//   node scripts/cdp.mjs eval "$(cat scripts/colour-snapshot.js)" > before.json
//   (edit, apply)
//   node scripts/cdp.mjs eval "$(cat scripts/colour-snapshot.js)" > after.json
//   node scripts/colour-diff.mjs before.json after.json
(() => {
    const props = ['background-color', 'background-image', 'color', 'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color', 'fill', 'box-shadow', 'outline-color'];
    const out = {};
    for (const el of document.querySelectorAll('body *')) {
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) continue;
        const cls = typeof el.className === 'string' ? el.className : el.getAttribute('class') || '';
        const key = el.tagName.toLowerCase() + '.' + cls.split(/\s+/).filter(Boolean).slice(0, 3).join('.');
        const cs = getComputedStyle(el);
        const k = key + ' :: ' + props.map((p) => cs.getPropertyValue(p)).join(' | ');
        out[k] = (out[k] || 0) + 1;
    }
    return { path: location.pathname, out };
})()
