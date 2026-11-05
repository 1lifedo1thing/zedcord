#!/usr/bin/env node
// Drives the running Vesktop window over CDP (Vesktop must be launched with --remote-debugging-port=9229).
//
//   node scripts/cdp.mjs apply [--flavor rose-pine]  build, write DEV_OUTPUT_PATH, inject (window.__themeDev helpers included)
//   node scripts/cdp.mjs eval '<js expression>'      evaluate in Discord, awaits promises, prints JSON
//   node scripts/cdp.mjs shot <out.png> [selector] [--width N] [--pad N] [--clip x,y,w,h] [--hover '<selector>']
//                                                    screenshot whole window or one element's box, downscaled to N px wide (default 1400);
//                                                    --hover forces :hover on an element for the capture (the real cursor can't interfere)
//   node scripts/cdp.mjs nav /channels/@me           client-side navigation (no reload, injection survives)
//   node scripts/cdp.mjs click '<selector>'          element.click() on first match
//   node scripts/cdp.mjs hover '<selector>'          real mouse move to the element centre (for :hover states)
//   node scripts/cdp.mjs mouse '<selector>' [right]  real mouse press/release at the element centre (right = context menu)
//   node scripts/cdp.mjs key Escape                  dispatch a key press to the page

import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = process.env.CDP_PORT || 9229;

async function connect() {
    const targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
    const target = targets.find((t) => t.type === 'page' && t.url.includes('discord.com'));
    if (!target) throw new Error('no Discord page target; is Vesktop running with --remote-debugging-port?');
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
        ws.onopen = resolve;
        ws.onerror = reject;
    });
    let id = 0;
    const pending = new Map();
    ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id && pending.has(msg.id)) {
            const { resolve, reject } = pending.get(msg.id);
            pending.delete(msg.id);
            msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
        }
    };
    const send = (method, params = {}) =>
        new Promise((resolve, reject) => {
            const msgId = ++id;
            pending.set(msgId, { resolve, reject });
            ws.send(JSON.stringify({ id: msgId, method, params }));
        });
    return { send, close: () => ws.close() };
}

async function evaluate(cdp, expression) {
    const res = await cdp.send('Runtime.evaluate', {
        expression,
        awaitPromise: true,
        returnByValue: true,
        userGesture: true,
    });
    if (res.exceptionDetails) {
        const d = res.exceptionDetails;
        throw new Error(d.exception?.description || d.text);
    }
    return res.result.value;
}

async function rectOf(cdp, selector, pad) {
    return evaluate(
        cdp,
        `(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return null;
        const r = el.getBoundingClientRect(); const p = ${pad};
        const x = Math.max(0, r.left - p), y = Math.max(0, r.top - p);
        return { x, y, width: Math.min(innerWidth - x, r.width + 2 * p), height: Math.min(innerHeight - y, r.height + 2 * p) }; })()`,
    );
}

// element centre in window (DIP) coordinates, which Input.dispatchMouseEvent expects; CSS px differ by the zoom
async function centreOf(cdp, selector) {
    return evaluate(
        cdp,
        `(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return null;
        const r = el.getBoundingClientRect(); const zoom = outerWidth / innerWidth;
        return { x: (r.left + r.width / 2) * zoom, y: (r.top + r.height / 2) * zoom }; })()`,
    );
}

function opt(args, name, fallback) {
    const i = args.indexOf(name);
    if (i === -1) return fallback;
    const v = args[i + 1];
    args.splice(i, 2);
    return v;
}

const [cmd, ...args] = process.argv.slice(2);
const cdp = await connect();
try {
    if (cmd === 'apply') {
        // build with midnight's build.js, then inject through midnight's loader (embedded mode, adds window.__themeDev)
        const require = createRequire(import.meta.url);
        const { buildCombinedTheme, config } = require('./build.js');
        // --flavor <name> previews theme/flavors/zed-<name>.theme.css instead, in the installed copy too
        // (a plain `apply` puts one dark back)
        const flavorsDir = path.join(root, 'theme', 'flavors');
        const flavor = opt(args, '--flavor', null);
        const css = buildCombinedTheme(flavor ? path.join(flavorsDir, `zed-${flavor}.theme.css`) : undefined);
        // also update the installed copy (DEV_OUTPUT_PATH in .env): vencord's theme loads after the injected
        // style and would win ties. temp file + rename so vencord's directory watcher hot-reloads it
        const env = fs.existsSync(path.join(root, '.env')) ? fs.readFileSync(path.join(root, '.env'), 'utf8') : '';
        const target = env.match(/^DEV_OUTPUT_PATH="?([^"\n]+)"?/m)?.[1];
        const install = (file, text) => {
            const tmp = path.join(path.dirname(file), '.zed-dev.tmp');
            fs.writeFileSync(tmp, text);
            fs.renameSync(tmp, file);
        };
        if (target) {
            install(target, css);
            // each flavor also gets its own installed copy beside it, to pick in vencord's theme list
            for (const file of fs.existsSync(flavorsDir) ? fs.readdirSync(flavorsDir) : []) {
                if (file.endsWith('.theme.css')) install(path.join(path.dirname(target), file), buildCombinedTheme(path.join(flavorsDir, file)));
            }
        }
        const runtime = { base: null, displayName: config.displayName, version: Date.now(), css };
        const loader = fs.readFileSync(path.join(root, 'scripts', 'inject.js'), 'utf8').replace('__THEME_DEV_RUNTIME__', () => JSON.stringify(runtime));
        console.log(JSON.stringify(await evaluate(cdp, `(async () => {\n${loader}\nreturn window.__themeDev.ready;\n})()`)));
    } else if (cmd === 'eval') {
        const out = await evaluate(cdp, args.join(' '));
        console.log(typeof out === 'string' ? out : JSON.stringify(out, null, 1));
    } else if (cmd === 'shot') {
        // capture the full window, then crop with ImageMagick in CSS-px space scaled to image px
        // (CDP clip rects don't account for Vesktop's zoom factor)
        const width = Number(opt(args, '--width', 1400));
        const pad = Number(opt(args, '--pad', 0));
        const region = opt(args, '--clip', null);
        const forceHover = opt(args, '--hover', null);
        const [out, selector] = args;
        if (forceHover) {
            await cdp.send('DOM.enable');
            await cdp.send('CSS.enable');
            const { root: doc } = await cdp.send('DOM.getDocument', { depth: 0 });
            const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: doc.nodeId, selector: forceHover });
            if (!nodeId) throw new Error(`no element for ${forceHover}`);
            await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: ['hover'] });
            await new Promise((r) => setTimeout(r, 200));
        }
        let rect = null;
        if (region) {
            const [x, y, w, h] = region.split(',').map(Number);
            rect = { x, y, width: w, height: h };
        } else if (selector) {
            rect = await rectOf(cdp, selector, pad);
            if (!rect) throw new Error(`no element for ${selector}`);
        }
        const inner = await evaluate(cdp, 'innerWidth');
        const { data } = await cdp.send('Page.captureScreenshot', { format: 'png' });
        fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
        fs.writeFileSync(out, Buffer.from(data, 'base64'));
        const imgW = Number(execFileSync('sips', ['-g', 'pixelWidth', out], { encoding: 'utf8' }).match(/pixelWidth: (\d+)/)[1]);
        if (rect) {
            const k = imgW / inner;
            const geo = `${Math.round(rect.width * k)}x${Math.round(rect.height * k)}+${Math.round(rect.x * k)}+${Math.round(rect.y * k)}`;
            execFileSync('magick', [out, '-crop', geo, '+repage', out]);
        }
        execFileSync('magick', [out, '-resize', `${width}x>`, out]);
        console.log(out);
    } else if (cmd === 'nav') {
        console.log(
            await evaluate(
                cdp,
                `(Vencord.Webpack.Common.NavigationRouter.transitionTo(${JSON.stringify(args[0])}), location.pathname)`,
            ),
        );
    } else if (cmd === 'click') {
        console.log(
            await evaluate(cdp, `(() => { const el = document.querySelector(${JSON.stringify(args[0])}); if (!el) return 'not found'; el.click(); return 'clicked'; })()`),
        );
    } else if (cmd === 'hover') {
        const c = await centreOf(cdp, args[0]);
        if (!c) throw new Error(`no element for ${args[0]}`);
        await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...c });
        console.log('hovered');
    } else if (cmd === 'mouse') {
        // real mouse press + release at the element centre: `mouse '<selector>' [left|right]` (right = context menu)
        const c = await centreOf(cdp, args[0]);
        if (!c) throw new Error(`no element for ${args[0]}`);
        const button = args[1] === 'right' ? 'right' : 'left';
        const at = { ...c, button, clickCount: 1 };
        await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: at.x, y: at.y });
        await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', ...at });
        await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', ...at });
        console.log(`${button}-clicked`);
    } else if (cmd === 'key') {
        const key = args[0];
        for (const type of ['keyDown', 'keyUp']) {
            await cdp.send('Input.dispatchKeyEvent', { type, key, code: key, windowsVirtualKeyCode: key === 'Escape' ? 27 : 0 });
        }
        console.log('pressed', key);
    } else {
        console.error('unknown command; see header of scripts/cdp.mjs');
        process.exitCode = 1;
    }
} finally {
    cdp.close();
}
