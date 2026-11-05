#!/usr/bin/env node
// node scripts/colour-diff.mjs before.json after.json: elements (tag + first classes) whose computed colours changed.
// elements found in only one snapshot are skipped: those are content changes (new messages, another channel)
import fs from 'node:fs';

const [a, b] = process.argv.slice(2).map((f) => JSON.parse(fs.readFileSync(f, 'utf8')));
if (a.path !== b.path) console.log(`note: different pages (${a.path} vs ${b.path}); only shared chrome compares`);
const group = (snap) => {
    const m = {};
    for (const k of Object.keys(snap.out)) {
        const [el, v] = k.split(' :: ');
        (m[el] ??= new Set()).add(v);
    }
    return m;
};
const [A, B] = [group(a), group(b)];
let changed = 0;
for (const el of Object.keys(A)) {
    if (!B[el]) continue;
    const gone = [...A[el]].filter((v) => !B[el].has(v));
    const added = [...B[el]].filter((v) => !A[el].has(v));
    if (!gone.length && !added.length) continue;
    changed++;
    console.log(`## ${el}`);
    gone.forEach((v) => console.log(`  - ${v}`));
    added.forEach((v) => console.log(`  + ${v}`));
}
console.log(changed ? `${changed} changed` : 'no colour changes');
