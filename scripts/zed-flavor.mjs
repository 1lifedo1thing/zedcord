#!/usr/bin/env node
// Prints the :root block of a flavor from a Zed theme JSON: every --zed-* token from its Zed key, and the accent
// scales (shade 2 = the theme's colour, 1 and 3-5 keep One Dark's OKLCH lightness and chroma steps, gamut-mapped).
//
//   node scripts/zed-flavor.mjs <theme.json> ["Theme Name"]
//
// <theme.json> is a theme family file (`{ themes: [...] }`, as in Zed's assets/themes/ or an extension's themes/)
// or a bare style object (research/one-dark.json). Lines marked CHECK need a decision: a key the theme leaves unset
// (Zed then falls back to crates/theme/src/default_colors.rs), or --zed-guild-icon, which has no Zed key.

import fs from 'node:fs';

const [file, name] = process.argv.slice(2);
if (!file) {
    console.error('usage: node scripts/zed-flavor.mjs <theme.json> ["Theme Name"]');
    process.exit(1);
}
const json = JSON.parse(fs.readFileSync(file, 'utf8'));
const theme = json.themes ? (name ? json.themes.find((t) => t.name === name) : json.themes[0]) : { style: json };
if (!theme) throw new Error(`no theme named ${name}; have ${json.themes.map((t) => t.name).join(', ')}`);
const style = theme.style;
const syntax = style.syntax || {};

const hex = (v) => (typeof v === 'string' ? v.toLowerCase().replace(/^(#[0-9a-f]{6})ff$/, '$1') : null);
const lines = [];
const out = (token, value, note) => lines.push(`    --zed-${token}: ${value ?? 'CHECK'};${note ? ` /* ${note} */` : ''}`);
const key = (token, k, fallback) => {
    const v = hex(style[k]);
    out(token, v ?? fallback, v ? null : fallback ? `${k} unset; zed's default` : `CHECK: ${k} unset`);
};
const syn = (token, k, fallbackKey = 'editor.foreground') => {
    const v = hex(syntax[k]?.color);
    // a syntax key the theme leaves out draws in the editor's foreground
    out(token, v ?? hex(style[fallbackKey]), v ? null : `no ${k} colour: plain text`);
};

lines.push(`/* ${theme.name ?? file} */`, ':root {');
for (const [token, k] of [
    ['title-bar', 'title_bar.background'],
    ['status-bar', 'status_bar.background'],
    ['panel', 'panel.background'],
    ['surface', 'surface.background'],
    ['elevated-surface', 'elevated_surface.background'],
    ['tab-bar', 'tab_bar.background'],
    ['tab-active', 'tab.active_background'],
    ['editor', 'editor.background'],
    ['active-line', 'editor.active_line.background'],
    ['border', 'border'],
    ['border-variant', 'border.variant'],
    ['border-focused', 'border.focused'],
    ['border-selected', 'border.selected'],
    ['element', 'element.background'],
    ['element-hover', 'element.hover'],
    ['element-active', 'element.active'],
    ['element-selected', 'element.selected'],
]) key(token, k);
key('ghost-element', 'ghost_element.background', '#00000000');
for (const [token, k] of [
    ['ghost-element-hover', 'ghost_element.hover'],
    ['ghost-element-active', 'ghost_element.active'],
    ['ghost-element-selected', 'ghost_element.selected'],
    ['text', 'text'],
    ['text-muted', 'text.muted'],
    ['text-placeholder', 'text.placeholder'],
    ['text-accent', 'text.accent'],
    ['text-ignored', 'ignored'],
    ['editor-fg', 'editor.foreground'],
    ['line-number', 'editor.line_number'],
    ['scrollbar-thumb', 'scrollbar.thumb.background'],
]) key(token, k);
out('selection', hex(style.players?.[0]?.selection), style.players?.[0] ? null : 'CHECK: no players');

lines.push('');
for (const [token, k] of [
    ['keyword', 'keyword'],
    ['string', 'string'],
    ['number', 'number'],
    ['function', 'function'],
    ['type', 'type'],
    ['operator', 'operator'],
    ['comment', 'comment'],
]) syn(`syntax-${token}`, k);
out('syntax-comment-style', syntax.comment?.font_style || 'normal');
for (const [token, k] of [
    ['comment-doc', 'comment.doc'],
    ['property', 'property'],
    ['variable', 'variable'],
    ['punctuation', 'punctuation.bracket'],
    ['tag', 'tag'],
    ['attribute', 'attribute'],
    ['selector', 'selector'],
    ['emphasis', 'emphasis'],
    ['emphasis-strong', 'emphasis.strong'],
]) syn(`syntax-${token}`, k);

// accent scales from the status colours. purple has no status key: terminal magenta, refined below (one dark's own
// is its keyword)
const oneDark = {
    red: ['#e0959a', '#d07277', '#c45a60', '#b4474d', '#9c3a40'],
    green: ['#b9d29e', '#a1c181', '#8cae6a', '#779a56', '#638546'],
    blue: ['#9cc5f0', '#74ade8', '#5d9ce0', '#4d8bd3', '#3f78bf'],
    yellow: ['#e8d3a3', '#dec184', '#d4b064', '#c49c4a', '#a8843a'],
    purple: ['#c99ade', '#b477cf', '#a362c2', '#9150b1', '#7c4199'],
};
const bases = {
    red: hex(style.error),
    green: hex(style.success),
    blue: hex(style['text.accent']),
    yellow: hex(style.warning),
    purple: hex(style['terminal.ansi.magenta']),
};

const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const fromLinear = (c) => Math.round(Math.min(1, Math.max(0, c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055)) * 255);
function oklch(h) {
    const [r, g, b] = [1, 3, 5].map((i) => toLinear(parseInt(h.slice(i, i + 2), 16) / 255));
    const [l, m, s] = [
        0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b,
        0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b,
        0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b,
    ].map(Math.cbrt);
    const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
    const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
    const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
    return [L, Math.hypot(A, B), Math.atan2(B, A)];
}
function linearRgb([L, C, H]) {
    const [A, B] = [C * Math.cos(H), C * Math.sin(H)];
    const [l, m, s] = [L + 0.3963377774 * A + 0.2158037573 * B, L - 0.1055613458 * A - 0.0638541728 * B, L - 0.0894841775 * A - 1.291485548 * B].map((x) => x ** 3);
    return [
        4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
        -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
        -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
    ];
}
function toHex([L, C, H]) {
    // out of srgb (saturated bases like gruvbox's red, darkened): lower the chroma until it fits, keeping lightness
    // and hue, instead of clipping channels (which turns the shade pure red, or shifts its hue)
    const fits = (c) => linearRgb([L, c, H]).every((x) => x >= -1e-4 && x <= 1 + 1e-4);
    let lo = 0;
    let hi = C;
    if (!fits(C)) for (let i = 0; i < 30; i++) fits((lo + hi) / 2) ? (lo = (lo + hi) / 2) : (hi = (lo + hi) / 2);
    else lo = C;
    return '#' + linearRgb([L, lo, H]).map((c) => fromLinear(c).toString(16).padStart(2, '0')).join('');
}

// server tiles: `background`, else the resting button fill, if it stands out from the panels by 0.03 OKLCH
// lightness (one dark's tiles are 0.05 above; rosé pine's background is the panel colour, tokyo night's only 0.02 off)
lines.push('');
const panel = hex(style['panel.background']);
const visible = (h) => h && panel && !h.slice(7) && Math.abs(oklch(h)[0] - oklch(panel)[0]) >= 0.03;
const bg = hex(style.background);
const ghost = hex(style['ghost_element.background']);
if (visible(bg)) out('guild-icon', bg, 'background');
else if (visible(ghost)) out('guild-icon', ghost, 'CHECK: background is too close to the panels; ghost_element.background');
else out('guild-icon', null, 'CHECK: background and the resting button fill are too close to the panels; pick one');

// purple: terminal magenta, or its bright variant when that's the tier the other accents are in (gruvbox's
// error, success and warning are its bright colours). some themes' "magenta" isn't purple at all (ayu's is cyan):
// then the purple-to-pink syntax colour nearest the other accents' lightness, flagged.
const isPurple = (h) => {
    const deg = ((oklch(h)[2] * 180) / Math.PI + 360) % 360;
    return deg >= 280 || deg < 10;
};
const nearest = (candidates) => {
    const others = ['red', 'green', 'blue', 'yellow'].filter((c) => bases[c]).map((c) => oklch(bases[c])[0]);
    const mean = others.reduce((a, b) => a + b, 0) / others.length;
    return candidates.sort((a, b) => Math.abs(oklch(a)[0] - mean) - Math.abs(oklch(b)[0] - mean))[0];
};
let purpleNote = null;
const magentas = [bases.purple, hex(style['terminal.ansi.bright_magenta'])].filter((h) => h && isPurple(h));
if (magentas.length) bases.purple = nearest(magentas);
else {
    const syntaxPurples = [...new Set(Object.values(syntax).map((s) => hex(s?.color)).filter((h) => h && !h.slice(7) && isPurple(h)))];
    purpleNote = `CHECK: terminal magenta ${bases.purple} isn't purple; ${syntaxPurples.length ? `nearest purple syntax colour of ${syntaxPurples.join(', ')}` : 'pick one'}`;
    bases.purple = syntaxPurples.length ? nearest(syntaxPurples) : null;
}

lines.push('');
if (purpleNote) lines.push(`    /* ${purpleNote} */`);
for (const [colour, shades] of Object.entries(oneDark)) {
    const base = bases[colour];
    if (!base) {
        lines.push(`    /* CHECK: no base colour for ${colour} */`);
        continue;
    }
    const [L0, C0, H0] = oklch(base);
    const [Lr, Cr] = oklch(shades[1]);
    shades.forEach((shade, i) => {
        const [L, C] = oklch(shade);
        lines.push(`    --${colour}-${i + 1}: ${i === 1 ? base : toHex([L0 + (L - Lr), C0 * (C / Cr), H0])};`);
    });
}
lines.push('}');
console.log(lines.join('\n'));
