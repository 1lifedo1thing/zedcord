# zed-discord dev loop

A Discord theme that makes the client look like the Zed editor (default "One Dark"). Built on top of
midnight-discord, whose compiled build is copied in as the first source file (`src/midnight.css`, from
`~/Documents/midnight-discord/build/midnight.css`, minus its font import). The build scripts are midnight's,
unchanged; only `scripts/theme.config.js` differs.

## Layout

- `theme/zed.theme.css` — entry: header, font import, the build import placeholder (`@import url('../build/zed.css');`,
  replaced with the compiled CSS by `scripts/build.js`), and One Dark's colours: `--zed-*` tokens on `:root`,
  each a key of Zed's theme schema (named in the comments), plus the accent scales (`--red-1`…`--purple-5`).
- `theme/flavors/zed-<name>.theme.css` — other Zed themes (`rose-pine`): the same file with another theme's values,
  copied from its JSON. They build like the base file and are written beside `DEV_OUTPUT_PATH` under their own
  names, so they show up in Vencord's theme list.
- `src/variables.css` — what every flavor shares: Zed metrics, the midnight options the theme relies on, the forced
  density, and midnight's palette variables (`--bg-*`, `--text-*`, `--accent-*`…) mapped onto the `--zed-*` tokens.
- `src/*.css` — the Zed layer, compiled in the order listed in `scripts/theme.config.js` (`sourceFiles`). Adding
  or removing a file means updating that list or the build fails.
- `build/zed.css` — compiled `src/` (generated; don't hand-edit). `npm run dev` writes the fully inlined theme to
  `DEV_OUTPUT_PATH` (Vesktop's `themes/zed.theme.css`).
- `research/` — Zed reference: `zed-spec.md` (palette, metrics, fonts, icons from Zed's source),
  `one-dark.json`, `rose-pine.json` (the rose-pine-theme extension). Local only (gitignored): `zed-icons/` (SVGs
  copied from Zed's `assets/icons`) and `zed-onedark-full.png` (screenshot of real Zed in One Dark).

## Colour tokens

Pick the token by what the element is in Zed, not by what colour it happens to be in One Dark: other themes
split keys that One Dark gives the same value (Rosé Pine's panels are the editor colour, its tab bar is the
lighter surface, its `border.variant` is brighter than `border`, and its subtle buttons have a resting fill).

- surfaces: `--zed-title-bar`, `--zed-status-bar` (user area, composer), `--zed-panel` (docks: server, channel,
  member lists), `--zed-tab-bar` / `--zed-tab-active` (page headers), `--zed-editor` (chat), `--zed-surface`
  (embeds, code blocks), `--zed-elevated-surface` (menus, popouts, modals).
- rows: project-panel rows (channel list, dm list, settings nav) use `--zed-element-hover` / `-selected`, as Zed's
  project panel does; `ListItem` rows (member list, friends list, menus) use `--zed-ghost-element-hover` /
  `-selected`.
- buttons: subtle icon buttons (`ButtonStyle::Subtle`: header, composer, status bar, hover toolbar) rest on
  `--zed-ghost-element` and use `--zed-ghost-element-hover` / `-active`; filled ones (inputs, reactions) use
  `--zed-element*`.
- `--zed-guild-icon` is the one token with no Zed key (server tiles without an image); each theme file picks it.
- Check a flavor with `node scripts/cdp.mjs apply --flavor rose-pine` (the live copy too); a plain `apply` puts
  One Dark back.

## Live loop (Vesktop over CDP)

Vesktop is running with `--remote-debugging-port=9229`. `scripts/cdp.mjs` talks to it:

```bash
node scripts/cdp.mjs apply                         # build + inject (replaces previous injection); --flavor rose-pine
node scripts/cdp.mjs shot shots/x.png              # whole window, downscaled to 1400px wide
node scripts/cdp.mjs shot shots/x.png '.selector' --pad 8 --width 900   # one element
node scripts/cdp.mjs shot shots/x.png --clip x,y,w,h                    # CSS-px region
node scripts/cdp.mjs eval '<js>'                   # evaluate in Discord, awaits promises, prints JSON
node scripts/cdp.mjs nav /channels/@me             # client-side navigation (injection survives)
node scripts/cdp.mjs click '<selector>' | hover '<selector>' | key Escape
node scripts/cdp.mjs shot shots/x.png --clip x,y,w,h --hover '<selector>'  # force :hover (your real cursor wins over `hover`)
node scripts/cdp.mjs eval "$(node scripts/dom.js '<selector>' 10 80)"   # compact DOM tree with boxes
```

`apply` installs midnight's `window.__themeDev` helpers too: `compare(sel)` (theme on vs off),
`discordRules(sel, prop)` (what Discord's own CSS sets), `trace(sel, prop)`, `placeholders()`, `cssVar()`.
See `~/Documents/midnight-discord/docs/BROWSER_DEV.md` for details and the "fixing a visual bug" method.

Rules of thumb:

- Read Discord's DOM live (`dom.js`) instead of guessing class hashes; prefer exact hashed classes
  (`.link__2ea32`) like midnight does, and keep selectors low-specificity — no `!important` unless fighting an
  inline style.
- Don't change the heights of rows inside virtualized lists (channel list, member list, DM list, friends list,
  messages): the row must stay exactly the height Discord's JS assumes, or scrolling desyncs (rows render off
  screen or leave gaps). Restyle within the box; to make rows shorter, `zoom` the scroller (Discord's scrollTop,
  clientHeight and spacers all live inside the zoom, so the maths holds) and zoom each row's contents back, as the
  DM, member and friends lists do. Check with a scroll test: rows contiguous and filling the viewport at a few
  scroll offsets.
- Some sizes are set in JS and ignore CSS variables: server icon blobs (40px) and folder buttons (48px), open
  folders' server lists (48px per server, overflow hidden, so the gap between servers must stay 8px), member rows
  (42px, group headers 38px), DM rows (44px, 40 in compact density, 50 in cozy; links 40px, the divider 25px, the
  header 24px), friends rows (61px, section titles 50px). Shrink those visually (the server list is `zoom`ed, list
  avatars `transform: scale`d) instead of resizing them.
- Density is forced in `src/variables.css` (`:root:root`), so Discord's UI density / chat font size / group
  spacing settings don't change the theme. Vesktop's zoom is the user's call (it was set to 81.25% to match Zed at `ui_font_size: 13`).
- Use the `--zed-*` tokens, never raw hex, outside the theme files (tints are `color-mix()` of a token).
- Verify with a screenshot after each change; measure with `eval` when alignment matters.
- The window is the user's real Discord: they may be using it at the same time. Close anything you open
  (`key Escape`), don't send messages, don't change settings or click destructive actions.
