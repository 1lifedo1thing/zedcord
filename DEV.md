# zedcord dev loop

A Discord theme that makes the client look like the Zed editor (default "One Dark"). Built on top of
midnight-discord, whose compiled build is copied in as the first source file (`src/midnight.css`, from
`~/Documents/midnight-discord/build/midnight.css`, minus its font import). The build scripts are midnight's,
unchanged; only `scripts/theme.config.js` differs.

## Layout

- `theme/zedcord.theme.css` — entry: header, font import, the build import (`@import url('https://refact0r.github.io/zedcord/build/zedcord.css');`,
  served by GitHub Pages from `main`, and replaced with the compiled CSS by `scripts/build.js` for local dev), and One Dark's colours: `--zed-*` tokens on `:root`,
  each a key of Zed's theme schema (named in the comments), plus the accent scales (`--red-1`…`--purple-5`).
- `theme/flavors/zedcord-<name>.theme.css` — other Zed themes (`rose-pine`, `ayu-dark`, `gruvbox-dark`, `catppuccin-mocha`, `tokyo-night`): the same file
  with another theme's values, generated from its JSON. They build like the base file and are written beside `DEV_OUTPUT_PATH` under their own
  names, so they show up in Vencord's theme list.
- `src/variables.css` — what every flavor shares: Zed metrics, the midnight options the theme relies on, the forced
  density, and midnight's palette variables (`--bg-*`, `--text-*`, `--accent-*`…) mapped onto the `--zed-*` tokens.
- `src/*.css` — the Zed layer, compiled in the order listed in `scripts/theme.config.js` (`sourceFiles`). Adding
  or removing a file means updating that list or the build fails.
- `build/zedcord.css` — compiled `src/` (generated; don't hand-edit). `npm run dev` writes the fully inlined theme to
  `DEV_OUTPUT_PATH` (Vesktop's `themes/zedcord.theme.css`).
- `research/` — Zed reference: `zed-spec.md` (palette, metrics, fonts, icons from Zed's source),
  `one-dark.json`, `ayu.json` and `gruvbox.json` (Zed 1.27.0's built-in families), `rose-pine.json`, `catppuccin.json`
  (its mauve-accent file) and `tokyo-night.json` (from the extensions of those names). Local only (gitignored): `zed-icons/` (SVGs
  copied from Zed's `assets/icons`) and `zed-onedark-full.png` (screenshot of real Zed in One Dark).

## Colour tokens

Pick the token by what the element is in Zed, not by what colour it happens to be in One Dark: other themes
split keys that One Dark gives the same value (Rosé Pine's panels are the editor colour, its tab bar is the
lighter surface, its `border.variant` is brighter than `border`, and its subtle buttons have a resting fill).

- surfaces: `--zed-title-bar`, `--zed-status-bar` (user area, composer), `--zed-panel` (docks: server, channel,
  member lists), `--zed-tab-bar` / `--zed-tab-active` (page headers), `--zed-editor` (chat), `--zed-surface`
  (embeds, code blocks), `--zed-elevated-surface` (menus, popouts, modals).
- rows: project-panel rows (channel list, dm list, settings nav) use `--zed-element-hover` / `-selected`, as Zed's
  project panel does (`crates/project_panel/src/project_panel.rs`, `get_item_color`); `ListItem` rows (member
  list, friends list, menus) use `--zed-ghost-element-hover` / `-selected` (`crates/ui/src/components/list/list_item.rs`).
- buttons: subtle icon buttons (`ButtonStyle::Subtle`: header, composer, status bar, hover toolbar) rest on
  `--zed-ghost-element` and use `--zed-ghost-element-hover` / `-active`; outlined ones rest on the ghost fill and
  hover with ghost hover; filled ones (inputs, reactions) use `--zed-element*`
  (`crates/ui/src/components/button/button_like.rs`).
- `--zed-guild-icon` is the one token with no Zed key (server tiles without an image); each theme file picks it.
- New tokens must keep One Dark identical: give them One Dark's current value, and prove it with a before/after
  `scripts/colour-snapshot.js` + `scripts/colour-diff.mjs` (read-only; usage in the file). Snapshots of different
  pages also differ in content (usernames, embeds); only shared chrome counts.

## Porting a Zed theme (flavors)

1. Get the theme's JSON: built-in themes are compiled into Zed, so take them from its repo at the installed version
   (`defaults read /Applications/Zed.app/Contents/Info.plist CFBundleShortVersionString`, then
   `curl -fsSL https://raw.githubusercontent.com/zed-industries/zed/v<version>/assets/themes/<name>/<name>.json`); extension
   themes are installed at `~/Library/Application Support/Zed/extensions/installed/<extension>/themes/*.json`
   (one family file can hold several, e.g. rose-pine-theme ships Rosé Pine, Moon and Dawn). Copy it into
   `research/`.
2. `node scripts/zed-flavor.mjs research/<file>.json "<Theme Name>"` prints the flavor's `:root` block: every token
   from its Zed key, the accent scales, and `CHECK` lines for what needs a decision. Paste it into
   `theme/flavors/zedcord-<name>.theme.css` under a copy of the Rosé Pine file's header and imports. The script
   reproduces every flavor's declarations exactly apart from the CHECKs they settled (rerun it and diff after
   changing it); One Dark predates it and stays hand-tuned (see below).
3. Decisions the script can't make:
   - `--zed-guild-icon`: `background`, else the resting button fill, if it is at least 0.03 OKLCH lightness off
     the panels (One Dark's tiles are 0.05 above). Rosé Pine's `background` is the panel colour, so it takes
     `ghost_element.background`; Tokyo Night's background and button fill are both 0.02 off, so it takes
     `element.active` (#202330).
   - unset keys: Zed falls back to `crates/theme/src/default_colors.rs`; a syntax key the theme leaves out draws
     in `editor.foreground` (Rosé Pine has no `selector`, so CSS class selectors are plain text).
   - accents: shade 2 is `error` (red), `success` (green), `text.accent` (blue), `warning` (yellow) and a purple;
     shades 1 and 3-5 keep One Dark's OKLCH lightness and chroma steps at the base hue, lowering chroma where that
     leaves sRGB (clipping pushed Gruvbox's dark reds to pure red and shifted Ayu's hues). Purple has no status key: the script
     takes `terminal.ansi.magenta` or `bright_magenta`, whichever is nearer the other accents' lightness (Gruvbox's
     error, success and warning are its bright tier), and when neither is purple (Ayu's "magenta" is cyan) the
     nearest purple syntax colour, with a CHECK. Rosé Pine's success is pine (#31748f), so its online dots and
     green buttons are dark teal.
   - One Dark's deliberate deviations: `ignored` is #6b717d, not #878a98 (too close to muted for muted channels),
     its purple is its keyword colour, and its hand-picked shades drift in hue slightly.
4. Look at real Zed in the theme before trusting the port; values that look equal in the JSON can sit on
   different surfaces. Zed's built-in themes come from one template: if grouping the surface, border and element
   keys by equal value gives One Dark's groups (as Ayu and Gruvbox do), they lay out like One Dark, which is already
   matched to real Zed, and the JSON is enough. Extension themes (Rosé Pine, Catppuccin, Tokyo Night) each lay out
   differently and need the look. Zed is the user's editor: ask first (installing a theme for you to port counts),
   back up its settings, and put their theme back afterwards. Set `theme.dark` in `~/.config/zed/settings.json` (Zed reloads it live), find a window with `swift scripts/winid.swift zed`,
   capture it with `screencapture -x -o -T 2 -l <id> out.png` (`-T 2` waits for the reload), crop with `scripts/crop.swift`, and sample with
   `scripts/px.swift`. Captures are colour-managed, so samples read brighter than the JSON (Rosé Pine's #191724
   samples as #211f2f, #1f1d2e as #29283b): compare samples with each other, not with the JSON.
5. Things that differed for Rosé Pine and are kept as Zed draws them: the subtle-button fill is nearly invisible
   on the tab bar (#21202e on #1f1d2e); `element.hover` equals `element.active` (no press feedback on filled
   elements); `ghost_element.active` is very bright (#908caa), so pressed buttons flash; `border.focused` is
   close to the surfaces, so keyboard focus rings barely show. Catppuccin Mocha: the chrome (title bar, status
   bar, tab bar) is the darkest colour and the editor the lightest; selected rows are a faint translucent fill
   (#3132444d) and hovered ones solid #313244, so hover is brighter than selection; `text.muted` (#bac2de) is close
   to `text`, so read and unread channels differ little; its accent is mauve, so the blue scale is mauve. Tokyo
   Night: all chrome is one colour with a lighter editor; borders are near-black; hover and selected are the same
   bright slate (#565f89).
6. Previewing: `node scripts/cdp.mjs apply --flavor <name>` builds the flavor into the live installed copy, so it
   changes what the user sees: ask before running it, or have them enable `zedcord-<name>.theme.css` in Vencord
   themselves. A plain `apply` (also from another session) puts One Dark back. To install a new flavor without
   changing the live theme, build it with `buildCombinedTheme` and write it beside `DEV_OUTPUT_PATH`.
7. Light themes don't work yet; nothing has been looked at in Discord. Known problems:
   - `--text-0` (text on coloured buttons, badges, notices) is the editor colour: white on a light theme's accents,
     which are mid-tone. Contrast of text-0 on shade 2: One Light 3.0-3.8:1 (its purple 6.9), Ayu Light 1.9-3.3:1, Gruvbox Light
     3.3-7.6:1 (body text wants 4.5). They need a darker accent fill or their own text-on-accent token.
   - Discord's own mode stays dark (`theme-dark images-dark` on `<html>`): midnight remaps its variables under both
     modes, but illustrations, image variants and native controls (`color-scheme`) follow Discord's setting, so a
     light flavor needs Discord's appearance set to light too.
   - shades 1-5 copy One Dark's steps, where 1 is the brighter variant; on a light background brighter is fainter.

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
