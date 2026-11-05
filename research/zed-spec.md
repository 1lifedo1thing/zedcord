# Zed "One Dark" UI spec (for a Discord CSS theme)

Source-backed. Every number below was read from the `zed-industries/zed` repo (paths are repo-relative).

| | |
|---|---|
| Repo snapshot | `main` @ `c7bea343838f42b4c14151393e41f0bbe033c95e` (2026-11-04) |
| Installed app | `/Applications/Zed.app` = **1.27.0** = latest stable tag `v1.27.0` (published 2026-11-04) |
| Main vs v1.27.0 | Every file cited for metrics/colors is byte-identical on `v1.27.0`, except `assets/settings/default.json` (3 unrelated settings), `title_bar.rs`, `dock.rs` (non-visual), `context_menu.rs` (large refactor; I re-checked: min width 200px, `ListItem::inset(true)`, `elevation_2` unchanged) |
| Raw theme JSON | `research/one-dark.json` (the `style` object of the "One Dark" entry in `assets/themes/one/one.json`, 141 keys) |

## 0. Rules of thumb that make the numbers below interpretable

* **1 rem = `ui_font_size` = 16px by default** (`assets/settings/default.json:71`, `crates/theme_settings/src/settings.rs` `setup_ui_font` -> `window.set_rem_size(ui_font_size)`). Zed's own docs say "rem = 16px" but the real rem follows the user's `ui_font_size`. Nearly all sizes are `rems_from_px(N)` = `N/16 rem`, so they scale with the setting. Columns "@16" and "@14" below are the same rem value at `ui_font_size` 16 and 14 (scale factor 0.875).
* **Things that do NOT scale** (hard px): all borders (1px; some 2px), `TRAFFIC_LIGHT_PADDING` 78/71, title bar min 34, context menu min width 200, scrollbar 6/15, dock resize handle 6, Tab slots 12/14, project/collab indent step 20, ListItem default indent step 12, editor/buffer font (15px, separate setting), `Checkbox::container_size` 20.
* **Default text style** (root `Workspace` div): font = UI font, color = `text` (#dce0e5), base size 1rem (16px), **line-height 1.618034 (golden ratio, `phi()`)** for everything unless overridden (`crates/gpui/src/style.rs:494`). Labels default to 14px (see 3.1), so a one-line label box is **22.65px** tall.
* **Spacing scale** (`crates/gpui_macros/src/styles.rs`, `box_style_suffixes`): `gap_0p5`=2px, `1`=4, `1p5`=6, `2`=8, `2p5`=10, `3`=12, `3p5`=14, `4`=16, `5`=20, `6`=24, `7`=28, `8`=32, `9`=36 (n x 0.25rem). `px`=1px.
* **Radius scale** (same file, `corner_suffixes`): `xs` 2px (0.125rem), **`sm` 4px**, `md` 6px, **`lg` 8px**, `xl` 12px, `full` 9999px. (Not the Tailwind values: `rounded_sm` is 4px here.)
* **Text color roles** (`crates/ui/src/styles/color.rs`): `Color::Default`=`text`, `Muted`=`text.muted`, `Hidden`=`status.hidden`, `Disabled`=`text.disabled`, `Placeholder`=`text.placeholder`, `Accent`/`Selected`=`text.accent`, `Error/Warning/Success/Info/Created/Modified/Deleted/Conflict/Ignored/Hint`=`status.*`.
* All hex below are CSS-ready. Zed stores `#rrggbbaa`; fully opaque values are shortened to `#rrggbb`. Alpha is the last two digits.

## 1. One Dark palette (exact)

Source: `assets/themes/one/one.json` -> `themes[name="One Dark"].style`. Appearance `dark`. Missing keys fall back to `ThemeColors::dark()` (`crates/theme/src/default_colors.rs`) and a few are derived (`crates/theme_settings/src/schema.rs`); those are resolved in the last table of this section.

### 1.1 Layer hierarchy at a glance (what you actually see)

| Layer | Token(s) | Hex | Used by |
|---|---|---|---|
| Window chrome (lightest) | `background`, `title_bar.background`, `status_bar.background` | `#3b414d` | title bar, status bar, drag ghost, tab-bar-less gaps |
| Panels / surfaces | `panel.background`, `surface.background`, `elevated_surface.background`, `tab_bar.background`, `tab.inactive_background`, `editor.subheader.background` | `#2f343e` | docks (project/collab/git/outline), tab strip, **menus, tooltips, popovers, modals, picker** |
| Editor (darkest) | `editor.background`, `editor.gutter.background`, `tab.active_background`, `toolbar.background` | `#282c33` | buffer area, active tab, breadcrumb toolbar |
| Border (strong) | `border` | `#464b57` | dock edges, tab separators, title/status separators, pane dividers (derived), inputs |
| Border (soft) | `border.variant` | `#363c46` | menu/tooltip/modal outlines, list separators, toolbar bottom, outlined button |
| Border focus | `border.focused` / `panel.focused_border`(default) | `#47679e` / `#2870bd` | keyboard focus rings |
| Border selected | `border.selected` | `#293b5b` | active-pane border (off by default) |
| Element fill | `element.background` / `ghost_element.disabled` | `#2e343e` | inputs, filled buttons, checkbox fill, disabled bg |
| Hover | `element.hover`, `ghost_element.hover` | `#363c46` | row/button hover |
| Active / selected | `element.active`, `element.selected`, `ghost_element.active`, `ghost_element.selected` | `#454a56` | pressed + selected rows |
| Text | `text` / `icon` | `#dce0e5` | primary |
| Text muted | `text.muted` / `icon.muted` | `#a9afbc` | secondary labels, inactive tab text, headers |
| Text faint | `text.placeholder`, `text.disabled`, `icon.disabled`, `status.hidden` | `#878a98` | placeholder/disabled/unfocused tab |
| Accent | `text.accent`, `icon.accent`, `status.info`, `link_text.hover` | `#74ade8` | links, selected icon, highlights, info |
| Editor text | `editor.foreground` | `#acb2be` | code text (dimmer than UI text) |
| Selection (editor) | `players[0].selection` | `#74ade83d` | text selection (24%) |
| Scrollbar thumb | `scrollbar.thumb.background` | `#c8ccd44c` | 30% pale-grey thumb; hover thumb is solid `#363c46` |
| Modal wash | `elevated_surface.background` x 0.8 alpha | `#2f343ecc` | behind modals/picker (`modal_layer.rs`: `fade_out(0.2)`) |

### 1.2 Every UI key in One Dark


**Surfaces and borders**

| JSON key | value | note |
|---|---|---|
| `elevated_surface.background` | `#2f343e` |  |
| `surface.background` | `#2f343e` |  |
| `background` | `#3b414d` |  |
| `status_bar.background` | `#3b414d` |  |
| `title_bar.background` | `#3b414d` |  |
| `title_bar.inactive_background` | `#2e343e` |  |
| `toolbar.background` | `#282c33` |  |
| `tab_bar.background` | `#2f343e` |  |
| `tab.inactive_background` | `#2f343e` |  |
| `tab.active_background` | `#282c33` |  |
| `panel.background` | `#2f343e` |  |
| `editor.background` | `#282c33` |  |
| `editor.gutter.background` | `#282c33` |  |
| `editor.subheader.background` | `#2f343e` |  |
| `terminal.background` | `#282c34` |  |

**Borders**

| JSON key | value | note |
|---|---|---|
| `border` | `#464b57` |  |
| `border.variant` | `#363c46` |  |
| `border.focused` | `#47679e` |  |
| `border.selected` | `#293b5b` |  |
| `border.transparent` | `#00000000` | alpha 0% |
| `border.disabled` | `#414754` |  |
| `panel.focused_border` | `null` | null in JSON -> falls back to default below |
| `pane.focused_border` | `null` | null in JSON -> falls back to default below |

**Text and icons**

| JSON key | value | note |
|---|---|---|
| `text` | `#dce0e5` |  |
| `text.muted` | `#a9afbc` |  |
| `text.placeholder` | `#878a98` |  |
| `text.disabled` | `#878a98` |  |
| `text.accent` | `#74ade8` |  |
| `icon` | `#dce0e5` |  |
| `icon.muted` | `#a9afbc` |  |
| `icon.disabled` | `#878a98` |  |
| `icon.placeholder` | `#a9afbc` |  |
| `icon.accent` | `#74ade8` |  |
| `link_text.hover` | `#74ade8` |  |

**Elements (buttons, inputs)**

| JSON key | value | note |
|---|---|---|
| `element.background` | `#2e343e` |  |
| `element.hover` | `#363c46` |  |
| `element.active` | `#454a56` |  |
| `element.selected` | `#454a56` |  |
| `element.disabled` | `#2e343e` |  |

**Ghost elements (list rows, subtle buttons)**

| JSON key | value | note |
|---|---|---|
| `ghost_element.background` | `#00000000` | alpha 0% |
| `ghost_element.hover` | `#363c46` |  |
| `ghost_element.active` | `#454a56` |  |
| `ghost_element.selected` | `#454a56` |  |
| `ghost_element.disabled` | `#2e343e` |  |

**Misc interaction**

| JSON key | value | note |
|---|---|---|
| `drop_target.background` | `#83899480` | alpha 50% |
| `search.match_background` | `#74ade866` | alpha 40% |
| `search.active_match_background` | `#e8af7466` | alpha 40% |

**Scrollbar**

| JSON key | value | note |
|---|---|---|
| `scrollbar.thumb.background` | `#c8ccd44c` | alpha 30% |
| `scrollbar.thumb.hover_background` | `#363c46` |  |
| `scrollbar.thumb.border` | `#363c46` |  |
| `scrollbar.track.background` | `#00000000` | alpha 0% |
| `scrollbar.track.border` | `#2e333c` |  |

**Editor**

| JSON key | value | note |
|---|---|---|
| `editor.foreground` | `#acb2be` |  |
| `editor.active_line.background` | `#2f343ebf` | alpha 75% |
| `editor.highlighted_line.background` | `#2f343e` |  |
| `editor.line_number` | `#4e5a5f` |  |
| `editor.active_line_number` | `#d0d4da` |  |
| `editor.hover_line_number` | `#acb0b4` |  |
| `editor.invisible` | `#4e5a5f` |  |
| `editor.wrap_guide` | `#c8ccd40d` | alpha 5% |
| `editor.active_wrap_guide` | `#c8ccd41a` | alpha 10% |
| `editor.document_highlight.read_background` | `#74ade81a` | alpha 10% |
| `editor.document_highlight.write_background` | `#555a6366` | alpha 40% |

**Version control**

| JSON key | value | note |
|---|---|---|
| `version_control.added` | `#27a657` |  |
| `version_control.modified` | `#d3b020` |  |
| `version_control.word_added` | `#2ea04859` | alpha 35% |
| `version_control.word_deleted` | `#78081bcc` | alpha 80% |
| `version_control.deleted` | `#e06c76` |  |
| `version_control.conflict_marker.ours` | `#a1c1811a` | alpha 10% |
| `version_control.conflict_marker.theirs` | `#74ade81a` | alpha 10% |

**Terminal (non-ANSI)**

| JSON key | value | note |
|---|---|---|
| `terminal.foreground` | `#abb2bf` |  |
| `terminal.bright_foreground` | `#dce0e5` |  |
| `terminal.dim_foreground` | `#636d83` |  |


### 1.3 Status colors, terminal ANSI, players, syntax

**Status colors** (`status.*` in Zed; flat keys in the JSON). `bg` is a 10% tint of the fg; `border` is a darker hand-picked shade.

| status | fg | background | border |
|---|---|---|---|
| `error` | `#d07277` | `#d072771a` | `#4c2b2c` |
| `warning` | `#dec184` | `#dec1841a` | `#5d4c2f` |
| `info` | `#74ade8` | `#74ade81a` | `#293b5b` |
| `hint` | `#788ca6` | `#5a6f891a` | `#293b5b` |
| `success` | `#a1c181` | `#a1c1811a` | `#38482f` |
| `created` | `#a1c181` | `#a1c1811a` | `#38482f` |
| `modified` | `#dec184` | `#dec1841a` | `#5d4c2f` |
| `deleted` | `#d07277` | `#d072771a` | `#4c2b2c` |
| `conflict` | `#dec184` | `#dec1841a` | `#5d4c2f` |
| `renamed` | `#74ade8` | `#74ade81a` | `#293b5b` |
| `ignored` | `#878a98` | `#696b771a` | `#464b57` |
| `hidden` | `#878a98` | `#696b771a` | `#414754` |
| `predictive` | `#5a6a87` | `#5a6a871a` | `#38482f` |
| `unreachable` | `#a9afbc` | `#8389941a` | `#464b57` |

**Terminal ANSI** (`terminal.ansi.*`)

| name | normal | bright | dim |
|---|---|---|---|
| black | `#282c34` | `#636d83` | `#3b3f4a` |
| red | `#e06c75` | `#ea858b` | `#a7545a` |
| green | `#98c379` | `#aad581` | `#6d8f59` |
| yellow | `#e5c07b` | `#ffd885` | `#b8985b` |
| blue | `#61afef` | `#85c1ff` | `#457cad` |
| magenta | `#c678dd` | `#d398eb` | `#8d54a0` |
| cyan | `#56b6c2` | `#6ed5de` | `#3c818a` |
| white | `#abb2bf` | `#fafafa` | `#8f969b` |

**Players** (`players[i]`; i=0 is the local user. `cursor`==`background` in every entry; `selection` is the same hue at alpha 0x3d = 24%)

| i | cursor / background | selection |
|---|---|---|
| 0 | `#74ade8` | `#74ade83d` |
| 1 | `#be5046` | `#be50463d` |
| 2 | `#bf956a` | `#bf956a3d` |
| 3 | `#b477cf` | `#b477cf3d` |
| 4 | `#6eb4bf` | `#6eb4bf3d` |
| 5 | `#d07277` | `#d072773d` |
| 6 | `#dec184` | `#dec1843d` |
| 7 | `#a1c181` | `#a1c1813d` |

**Syntax** (`syntax.*`; all `font_style`/`font_weight` are null unless shown)

| token | color | style |
|---|---|---|
| `attribute` | `#74ade8` |  |
| `boolean` | `#bf956a` |  |
| `comment` | `#5d636f` |  |
| `comment.doc` | `#878e98` |  |
| `constant` | `#dfc184` |  |
| `constructor` | `#73ade9` |  |
| `embedded` | `#dce0e5` |  |
| `emphasis` | `#74ade8` |  |
| `emphasis.strong` | `#bf956a` | weight 700 |
| `enum` | `#6eb4bf` |  |
| `function` | `#73ade9` |  |
| `hint` | `#788ca6` |  |
| `keyword` | `#b477cf` |  |
| `label` | `#74ade8` |  |
| `link_text` | `#73ade9` | italic |
| `link_uri` | `#6eb4bf` |  |
| `namespace` | `#dce0e5` |  |
| `number` | `#bf956a` |  |
| `operator` | `#6eb4bf` |  |
| `predictive` | `#5a6a87` | italic |
| `preproc` | `#b477cf` |  |
| `primary` | `#acb2be` |  |
| `property` | `#d07277` |  |
| `punctuation` | `#acb2be` |  |
| `punctuation.bracket` | `#b2b9c6` |  |
| `punctuation.delimiter` | `#b2b9c6` |  |
| `punctuation.list_marker` | `#d07277` |  |
| `punctuation.markup` | `#d07277` |  |
| `punctuation.special` | `#b1574b` |  |
| `selector` | `#dfc184` |  |
| `selector.pseudo` | `#74ade8` |  |
| `string` | `#a1c181` |  |
| `string.escape` | `#878e98` |  |
| `string.regex` | `#bf956a` |  |
| `string.special` | `#bf956a` |  |
| `string.special.symbol` | `#bf956a` |  |
| `tag` | `#74ade8` |  |
| `text.literal` | `#a1c181` |  |
| `title` | `#d07277` | weight 400 |
| `type` | `#6eb4bf` |  |
| `variable` | `#acb2be` |  |
| `variable.parameter` | `#d07277` |  |
| `variable.special` | `#bf956a` |  |
| `variant` | `#73ade9` |  |
| `diff.plus` | `#98c379` |  |
| `diff.minus` | `#e06c75` |  |


### 1.4 Keys One Dark does not set

**Keys One Dark does not set (or sets to null)**: resolved either from `ThemeColors::dark()` in `crates/theme/src/default_colors.rs` (Radix scales; `neutral` = `sand`, a *warm* grey that clashes with One Dark blue-greys) or derived in `crates/theme_settings/src/schema.rs`. Field names are the Rust snake_case names (JSON key = same with `.` for `_` at word boundaries).

| field | value | source |
|---|---|---|
| `element_selection_background` | `#74ade83d` | derived: `players[0].selection` (`apply_theme_color_defaults`) |
| `drop_target_border` | `#eeeeec` | default (`ThemeColors::dark()`) |
| `debugger_accent` | `#dc3e42` | default (`ThemeColors::dark()`) |
| `panel_focused_border` | `#2870bd` | default = blue dark step 8 (JSON value is null) |
| `panel_indent_guide` | `#fefef31b` | default (`ThemeColors::dark()`) |
| `panel_indent_guide_hover` | `#fffaed2d` | default (`ThemeColors::dark()`) |
| `panel_indent_guide_active` | `#fffaed2d` | default (`ThemeColors::dark()`) |
| `panel_overlay_background` | `#2f343e` | derived: panel.background, forced opaque |
| `panel_overlay_hover` | `#363c46` | derived: panel.background blended with element.hover |
| `pane_focused_border` | `#004074` | default = blue dark step 5 (JSON value is null) |
| `pane_group_border` | `#464b57` | derived: `.or(border)` in `theme_colors_refinement` |
| `scrollbar_thumb_active_background` | `#c8ccd44c` | derived: = scrollbar.thumb.background |
| `minimap_thumb_background` | `#c8ccd44c` | derived: scrollbar thumb, alpha capped at 0.7 |
| `minimap_thumb_hover_background` | `#363c46b2` | derived: scrollbar hover thumb, alpha capped at 0.7 |
| `minimap_thumb_active_background` | `#c8ccd44c` | derived |
| `minimap_thumb_border` | `#363c46` | derived: = scrollbar.thumb.border |
| `editor_code_lens_foreground` | `none` | default (`ThemeColors::dark()`) |
| `editor_debugger_active_line_background` | `#ffaa001e` | default (`ThemeColors::dark()`) |
| `editor_indent_guide` | `#fefef31b` | default (`ThemeColors::dark()`) |
| `editor_indent_guide_active` | `#fffaed2d` | default (`ThemeColors::dark()`) |
| `editor_document_highlight_bracket_background` | `#74ade81a` | derived: = read highlight |
| `editor_diff_hunk_added_background` | `#27a6571f` | derived: version_control.added @ 12% |
| `editor_diff_hunk_added_hollow_background` | `#27a6570f` | derived: @ 6% |
| `editor_diff_hunk_added_hollow_border` | `#27a6575c` | derived: @ 36% |
| `editor_diff_hunk_deleted_background` | `#e06c761f` | derived: version_control.deleted @ 12% |
| `editor_diff_hunk_deleted_hollow_background` | `#e06c760f` | derived: @ 6% |
| `editor_diff_hunk_deleted_hollow_border` | `#e06c765c` | derived: @ 36% |
| `terminal_ansi_background` | `#111110` | default (`ThemeColors::dark()`) |
| `version_control_renamed` | `#dec184` | derived: = status modified |
| `version_control_conflict` | `#878a98` | derived: = status ignored |
| `version_control_ignored` | `#878a98` | derived: = status ignored |
| `vim_*` (normal/insert/replace/visual/helix bg+fg) | `#00000000` | default; `vim_yank_background` = `#fefef31b`, `vim_helix_jump_label_foreground` = `#e5484d` |


## 2. Fonts

### 2.1 What the virtual font names resolve to

| Zed name | Default for | Resolves to | Source |
|---|---|---|---|
| `.ZedSans` (alias `Zed Plex Sans`) | `ui_font_family` | **IBM Plex Sans** | `crates/gpui/src/text_system.rs:1262` `font_name_with_fallbacks` (+`:1276` `_shared`); comment at `assets/settings/default.json:57` ("currently aliases to IBM Plex Sans") |
| `.ZedMono` (alias `Zed Plex Mono`) | `buffer_font_family` (editor, terminal, code) | **Lilex** | same functions; `default.json:29` ("currently aliases to Lilex") |
| `.SystemUIFont` | opt-in | OS UI font | same |

**Bundled files** (`assets/fonts/`): IBM Plex Sans = `IBMPlexSans-Regular.ttf` (400), `-Italic.ttf`, `-SemiBold.ttf` (600), `-SemiBoldItalic.ttf`. **There is no Medium (500) and no Bold (700) face**: anything bold-ish renders SemiBold. Lilex = `Lilex-Regular.ttf` (400), `-Italic`, `-Bold` (700), `-BoldItalic`. Both OFL.

### 2.2 Font defaults (`assets/settings/default.json`)

| Setting | Default | Line |
|---|---|---|
| `ui_font_family` | `.ZedSans` | 59 |
| `ui_font_size` | **16** (= 1rem, see section 0) | 71 |
| `ui_font_weight` | 400 | 69 |
| `ui_font_features` | `{"calt": false}` (**ligatures/contextual alternates OFF in UI**) | 64-66 |
| `buffer_font_family` | `.ZedMono` | 31 |
| `buffer_font_size` | **15** (px, not rem) | 41 |
| `buffer_font_weight` | 400 | 43 |
| `buffer_line_height` | `"comfortable"` = **1.618** (`standard` = 1.3, `custom`) (`crates/theme/src/buffer_line_height.rs`) | 54 |
| `buffer_font_features` | `{}` (Lilex ligatures **ON**) | 36 |
| `agent_buffer_font_size` / `git_commit_buffer_font_size` | 12 / 12 | 79 / 81 |
| UI line-height | 1.618034 for all UI text (`gpui/src/style.rs:494`); context menus/pickers force 1.618 explicitly | - |
| Weights actually used in UI | 400 almost everywhere; `SEMIBOLD` only for project-panel bold folders (opt-in), a few modal sub-labels; `MEDIUM` only in `CountBadge` (falls to 400 since no 500 face) | `count_badge.rs:50`, `project_panel.rs:6814` |
| Text-transform | none anywhere (GPUI has no `text-transform`; headings are written in sentence case) | - |

Text sizes in use: 16 / **14 (default label)** / 12 / 10 px at rem=16 (details in 3.1). Code/buffer: 15px Lilex.

### 2.3 Loading the exact fonts in a browser theme (all URLs curl-verified, HTTP 200)

CSP reminder from you: `fonts.googleapis.com`, `cdn.jsdelivr.net`, `*.github.io`, `raw.githubusercontent.com` allowed. **`fonts.gstatic.com` was not in your list** and Google's CSS points all font files at it (see option C) - so Option A or B is the safe choice (one allowed host serves both CSS and font files; `access-control-allow-origin: *` on all of them).

Both families are available on both Google Fonts and Fontsource:

| Family | Google Fonts | Fontsource (npm, via jsDelivr) | Notes |
|---|---|---|---|
| IBM Plex Sans | yes (`ibmplexsans/v23`, variable build, weights 100-700, wdth axis) | `@fontsource/ibm-plex-sans@5.3.0` (OFL-1.1, static 100-700 + italics, subsets cyrillic/greek/latin/vietnamese...) | Zed ships only 400/600 |
| Lilex | yes (`lilex/v1`, variable 100-700) | `@fontsource/lilex@5.3.0` (OFL-1.1, static 100-700 + italics) | Zed ships only 400/700 |

**Option A - Fontsource through jsDelivr (recommended; static woff2, identical weights to Zed; 1 host).** Pin `@5.3.0` (current `latest`):

```
@import url("https://cdn.jsdelivr.net/npm/@fontsource/ibm-plex-sans@5.3.0/400.css");          /* 200 text/css */
@import url("https://cdn.jsdelivr.net/npm/@fontsource/ibm-plex-sans@5.3.0/600.css");          /* 200 */
@import url("https://cdn.jsdelivr.net/npm/@fontsource/ibm-plex-sans@5.3.0/400-italic.css");   /* 200 */
@import url("https://cdn.jsdelivr.net/npm/@fontsource/ibm-plex-sans@5.3.0/600-italic.css");   /* 200 */
@import url("https://cdn.jsdelivr.net/npm/@fontsource/lilex@5.3.0/400.css");                  /* 200 */
@import url("https://cdn.jsdelivr.net/npm/@fontsource/lilex@5.3.0/700.css");                  /* 200 */
@import url("https://cdn.jsdelivr.net/npm/@fontsource/lilex@5.3.0/400-italic.css");           /* 200 */
@import url("https://cdn.jsdelivr.net/npm/@fontsource/lilex@5.3.0/700-italic.css");           /* 200 */
```
Family names declared by those files: `'IBM Plex Sans'` and `'Lilex'`. Each CSS declares per-script `@font-face` blocks with `unicode-range` and `src: url(./files/<name>-<subset>-<weight>-<style>.woff2)`; the files resolve on `cdn.jsdelivr.net` (e.g. `.../ibm-plex-sans@5.3.0/files/ibm-plex-sans-latin-400-normal.woff2` -> 200 `font/woff2`, 22.6 KB; `.../lilex@5.3.0/files/lilex-latin-400-normal.woff2` -> 200, 20.1 KB). All 8 CSS files and the 8 latin woff2 files were fetched with 200. (Un-versioned `@fontsource/<name>/400.css` also works but is not pinned.)

**Option B - Zed's literal TTFs (byte-exact fonts), hand-written `@font-face`.** jsDelivr's GitHub endpoint serves them as `font/ttf` (pinned to the snapshot commit; `@main` also works). All 200:

| Face | URL (prefix `https://cdn.jsdelivr.net/gh/zed-industries/zed@c7bea343838f42b4c14151393e41f0bbe033c95e/assets/fonts/`) | weight/style | size |
|---|---|---|---|
| Plex Sans Regular | `ibm-plex-sans/IBMPlexSans-Regular.ttf` | 400 normal | 200,500 B |
| Plex Sans Italic | `ibm-plex-sans/IBMPlexSans-Italic.ttf` | 400 italic | 207,920 B |
| Plex Sans SemiBold | `ibm-plex-sans/IBMPlexSans-SemiBold.ttf` | 600 normal | 202,632 B |
| Plex Sans SemiBold Italic | `ibm-plex-sans/IBMPlexSans-SemiBoldItalic.ttf` | 600 italic | 211,072 B |
| Lilex Regular | `lilex/Lilex-Regular.ttf` | 400 normal | 194,308 B |
| Lilex Italic | `lilex/Lilex-Italic.ttf` | 400 italic | 198,216 B |
| Lilex Bold | `lilex/Lilex-Bold.ttf` | 700 normal | 192,992 B |
| Lilex Bold Italic | `lilex/Lilex-BoldItalic.ttf` | 700 italic | 197,532 B |

Same files also verified at `https://raw.githubusercontent.com/zed-industries/zed/main/assets/fonts/{ibm-plex-sans,lilex}/<file>` (200, `access-control-allow-origin: *`, but served as `application/octet-stream` + `nosniff`; browsers still load them as fonts). ~200 KB per face (unsubsetted) - heavier than Option A.

**Option C - Google Fonts (CSS verified 200; font files are on `fonts.gstatic.com`, verify your CSP):**
```
@import url("https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:ital,wght@0,400;0,600;1,400;1,600&family=Lilex:ital,wght@0,400;0,700;1,400;1,700&display=swap");
```
(200 `text/css`; with a browser UA it returns per-subset `@font-face` with `fonts.gstatic.com/s/ibmplexsans/v23/...woff2` and `fonts.gstatic.com/s/lilex/v1/...woff2`; spot-checked those woff2 -> 200.) Variable-range form also 200: `...?family=IBM+Plex+Sans:ital,wght@0,100..700;1,100..700&family=Lilex:wght@100..700&display=swap`.

**Fidelity notes for the theme**
* Match Zed: only request/declare **400 and 600** for Plex Sans, **400 and 700** for Lilex. For CSS `font-weight: 500` the browser will pick the 400 face and for `700` it will pick 600 - the same fallback Zed's UI has, so don't synthesize bold.
* UI text in Zed has `calt` disabled (`ui_font_features`), buffer text ligatures enabled; CSS equivalent is `font-feature-settings: "calt" 0` on the UI font only.
* Zed UI = Plex Sans 14px (labels) @ line-height 1.618; code = Lilex 15px @ 1.618.


## 3. UI metrics

Notation: **@16 / @14** = px at `ui_font_size` 16 / 14. "fixed" = hard px, does not scale. Heights of text rows come from line-height 1.618 x font size unless an explicit height is given.

### 3.1 Global tokens

**Text sizes** (`crates/ui/src/styles/typography.rs` `TextSize`, `crates/ui/src/components/label/label_like.rs`). Note the docstrings there say "0.825rem"; the code is `rems_from_px(14)` = 0.875rem.

| LabelSize / TextSize | rem | @16 | @14 | one-line box @16 (x1.618) |
|---|---|---|---|---|
| `Large` (`text_ui_lg`) | 1 | 16 | 14 | 25.9 |
| **`Default`** (`text_ui`, all Labels/Buttons/menu items/tooltips) | 0.875 | **14** | 12.25 | **22.65** |
| `Small` (`text_ui_sm`: status-bar buttons, title-bar buttons, sub-headers, meta) | 0.75 | 12 | 10.5 | 19.4 |
| `XSmall` (`text_ui_xs`) | 0.625 | 10 | 8.75 | 16.2 |
| `Custom(9px)` (`CountBadge`) | - | 9 | 7.9 | - |
| `Headline` XSmall/Small/Medium/Large/XLarge (`HeadlineSize`; modal titles use Small) | 0.88 / 1 / 1.125 / 1.27 / 1.43 | 14.1 / 16 / 18 / 20.3 / 22.9 | x0.875 | fixed 1.6rem (25.6 @16) |
| Buffer (editor, code) | - | 15 (separate setting) | 15 | 24.3 (x1.618) |

**DynamicSpacing** (`crates/ui/src/styles/spacing.rs` + `crates/ui_macros/src/dynamic_spacing.rs`; density setting `unstable.ui_density`, default `default`). Values are rem-based (x rem/16).

| Name | Compact | **Default @16** | Comfortable | **Default @14** | typical use |
|---|---|---|---|---|---|
| Base00 | 0 | 0 | 0 | 0 | |
| Base01 | 1 | 1 | 2 | 0.9 | |
| Base02 | 1 | 2 | 4 | 1.75 | icon-button square padding, `ListSubHeader` px |
| Base03 | 2 | 3 | 4 | 2.6 | |
| **Base04** | 2 | **4** | 6 | 3.5 | button px (Default/Compact), tab px+gap, status bar padding, `List` py, menu outer px |
| **Base06** | 3 | **6** | 8 | 5.25 | `ListItem` inner px, menu separator my, tab-bar start/end px, toolbar py |
| **Base08** | 4 | **8** | 10 | 7 | status-bar gap, toolbar px, large-button px, modal body gap |
| Base12 | 10 | 12 | 14 | 10.5 | modal header px, Switch thumb |
| Base16 | 14 | 16 | 18 | 14 | |
| Base20 | 18 | 20 | 22 | 17.5 | Switch track height |
| Base24 | 20 | 24 | 28 | 21 | |
| **Base32** | 28 | **32** | 36 | 28 | tab bar height, Switch track width |
| Base40 / Base48 | 36 / 44 | 40 / 48 | 44 / 52 | 35 / 42 | |

**Corner radii by component** (scale in section 0; all rem-based, so x0.875 at 14):

| Radius | px @16 | Used by |
|---|---|---|
| none | 0 | tabs, tab bar, title bar, status bar, toolbar, dock panels, project-panel rows (`rounded_none`), pane dividers |
| `xs` | 2 | Checkbox box, per-key chips in `KeyBinding`, project-panel folded-path segments |
| **`sm`** | **4** | **all Button/IconButton** (`ButtonLike`), `ListItem` rows when `inset`/`outlined`/`rounded` (context-menu & picker rows), `Chip`, `inline_code`, `KeybindingHint` chip, selected sidebar rows with `rounded` |
| `md` | 6 | search/filter inputs (`crates/search/src/search_bar.rs` `input_base_styles`), `ToggleButton` group, collab channel hover-controls (`rounded_l_md`) |
| **`lg`** | **8** | **every elevated surface**: context menu, tooltip, popover, modal, picker/command palette, notifications (`elevation_1/2/3` in `crates/ui/src/traits/styled_ext.rs`), dragged project entry |
| `full` | 9999 | Avatar, Switch track + thumb, CountBadge, Indicator dot, availability dots |
| 10 (fixed) | 10 | `CLIENT_SIDE_DECORATION_ROUNDING` - Linux/Windows client-drawn window corners only; macOS uses OS rounding |

**Border widths:** 1px for every divider/outline (fixed). 2px used for: dock-facing edge of a focused list row (`border_r_2` project panel/sidebar; `border_l_2`/`border_r_2` via `ListItem::dock()` in collab panel), Switch focus ring (2px transparent -> `border.focused`), drop-target tab edge, pinned-tabs divider when scrolled with active unpinned tab.

**Elevation** (`crates/ui/src/styles/elevation.rs` + `crates/ui/src/traits/styled_ext.rs`). Every `elevation_N()` = `bg elevated_surface.background #2f343e` + `border 1px border.variant #363c46` + radius 8px + shadows:

| Helper | ElevationIndex | Used by | Dark-theme box-shadow (CSS order) |
|---|---|---|---|
| `elevation_1` | Surface | (rare) | none |
| `elevation_2` | ElevatedSurface | context menu, tooltip, popover, hover cards | `0 2px 3px rgba(0,0,0,.12), 0 1px 0 rgba(0,0,0,.06)` |
| `elevation_3` | ModalSurface | modals, picker/command palette, notifications, toasts | `0 2px 3px rgba(0,0,0,.12), 0 3px 6px rgba(0,0,0,.08), 0 6px 12px rgba(0,0,0,.04), 0 1px 0 rgba(0,0,0,.12)` |
| `*_borderless` variants | - | | same shadows, no border |

(`BoxShadow::new(x, y, color).blur_radius(b)` matches CSS argument order; the 4th number above is the blur.) Light-theme alphas differ; ignore.

**Button sizes** (`crates/ui/src/components/button/button_like.rs` `ButtonSize`). Height is explicit; all buttons are `h_flex`, `gap Base04 (4px)`, radius `sm`, label default 14px unless `.label_size()`:

| ButtonSize | rem | height @16 / @14 | horizontal padding | where |
|---|---|---|---|---|
| Large | 2 | 32 / 28 | Base08 = 8 | big CTAs |
| Medium | 1.75 | 28 / 24.5 | Base08 = 8 | |
| **Default** | 1.375 | **22** / 19.25 | Base04 = 4 | **everything in chrome**: IconButtons, status/title-bar buttons |
| Compact | 1.125 | 18 / 15.75 | Base04 = 4 | |
| None | 1 | 16 / 14 | 1px | tab close button, menu link buttons |

**IconSize** (`crates/ui/src/components/icon.rs`): `Indicator` 10 (0.625rem), `XSmall` 12, **`Small` 14** (almost all chrome icons), **`Medium` 16** (default; tree icons, chevrons), `XLarge` 48. `IconButton` Square box = icon + 2 x Base02 (2px): XSmall 16, **Small 18**, Medium 20 (Indicator +0). `IconButton` default shape is **Wide** = icon + 2 x Base04 wide by 22 tall: Small icon -> **22x22**, Medium icon -> 24x22 (the usual toolbar button). Icon default color `Color::Default` (#dce0e5) for IconButton, **`Muted` (#a9afbc) for tree/list icons**, toggled/selected IconButton icon -> `Accent` #74ade8.

**Button state colors** (`ButtonStyle`, default `Subtle`; `button_like.rs` `ButtonStyle::{enabled,hovered,active}` + `ButtonLike::render`). Non-outlined styles show hover bg on keyboard focus-visible; outlined styles instead switch the border to `border.focused`.

| Style | rest bg | hover bg | active (pressed) bg | border | focus-visible |
|---|---|---|---|---|---|
| **Subtle** (default; ghost) | transparent | `#363c46` (ghost_element.hover) | `#454a56` | none | bg = hover bg |
| Transparent | transparent | transparent; label+icon -> Muted | transparent (Muted) | none | (nothing extra) |
| Filled | `#2e343e` (element.background; or the `layer()` elevation's bg) | same colour at **50% alpha** (`fade_out(0.5)`) | `#454a56` | none | bg = hover bg |
| Outlined | element bg `#2e343e` | `#363c46` + border `#464b57` | `#454a56`, border `#363c46` | **1px `#363c46`** (border.variant) | border `#47679e` |
| OutlinedGhost | transparent | `#363c46` + border `#464b57` | transparent, border `#363c46` | 1px `#363c46` | border `#47679e` |
| **Tinted(Accent/Error/Warning/Success)** | `status.<x>.background` (e.g. `#74ade81a`) | darkened (`theme.darken(bg, 0.05, 0.2)`) | same as rest | none (border colour is defined but no border width is applied) | |

Disabled buttons keep their rest bg (the `disabled()` style fn is dead code); only label/icon turn `text.disabled #878a98`, hover/active are removed and the cursor is `not-allowed`.

Selected/toggled `IconButton` with `.selected_style(Tinted(Error))` (e.g. muted mic in the title bar): bg `#d072771a`, icon `#d07277`.

### 3.2 Window chrome (macOS)

| Element | Value | @16 / @14 | Source |
|---|---|---|---|
| **Title bar height** | `max(1.75 x rem, 34px)` | **34 / 34** (28 and 24.5 are below the floor) | `crates/ui/src/utils/constants.rs` `platform_title_bar_height`; Windows is fixed 32 |
| Title bar bg | `title_bar.background` `#3b414d`; `title_bar.inactive_background` `#2e343e` is **only applied on Linux** (`platform_title_bar.rs` `title_bar_color`); macOS never dims | | `crates/platform_title_bar/src/platform_title_bar.rs` |
| Title bar left inset | 78px if built with macOS SDK >= 26, else 71px (fixed) for traffic lights; `pl_2` (8) when fullscreen | | `constants.rs` `TRAFFIC_LIGHT_PADDING` |
| Title bar contents | left group `gap_0p5` (2px) of Subtle `Button`s with **Small (12px)** labels (project name, branch); right group `pr_1`(4) `gap_1`(4): call controls (IconButton Small 22x22), user-menu `ButtonLike` with 16px round avatar; vertical `Divider` (1px x 16px, `border`) between groups | | `crates/title_bar/src/title_bar.rs` (:299, :368), `collab.rs` |
| Title bar bottom edge | no own border. The workspace container draws **1px `border` `#464b57` on top and bottom** of the pane area (so: 1px line under title bar and 1px line above status bar) | | `crates/workspace/src/workspace.rs` ~9893-9905 (`.border_t_1().border_b_1().border_color(colors.border)`) |
| **Tab bar height** | `DynamicSpacing::Base32` | **32 / 28** | `crates/ui/src/components/tab.rs` `container_height` (content_height = 31 / 27 + 1px border) |
| Tab bar bg | `tab_bar.background` `#2f343e`; whole bar has `border-bottom 1px #464b57` | | `tab_bar.rs` |
| Tab bar start/end slots | `px Base06`(6) `gap Base04`(4), `border-b` + `border-r` (start) / `border-l` (end), colour `border`. Start: back/forward IconButtons (Small), end: new/split/etc. | | `tab_bar.rs` |
| **Tab** | box: height 32, border-left/right 1px `#464b57`; **inactive** tab has `border-bottom 1px`, **active** tab has none (merges into editor). Inner: `px 4`, `gap 4`, content = `[start slot 12px (dirty-dot/icon)] [label] [end slot 14px (close x)]` -> label sits ~20px from tab edge, tab width = label + ~42px (+2 borders). **Rectangular, radius 0.** | | `tab.rs` `Tab::render`, consts `START_TAB_SLOT_SIZE=12`, `END_TAB_SLOT_SIZE=14` (fixed) |
| Tab colors | active: bg `#282c33`, label `#dce0e5`; inactive: bg `#2f343e`, label `#a9afbc`; **pane not focused:** active -> `#a9afbc`, inactive -> `#878a98` (`TabContentParams::text_color`, `crates/workspace/src/item.rs:143`). **No hover bg on tabs** (hover/active colours are computed but unused `_tab_hover_bg`). Close button: Small x, Square, Muted, **visible only on hover** (`show_close_button: hover`), on the **right** (`close_position: right`). File icons in tabs **off** by default (`tabs.file_icons: false`), git status colours off. | | `tab.rs`, `pane.rs` `render_tab`, `default.json:1495-1515` |
| Tab label | `Label` Default: 14px / 1.618, single line | | `item.rs` `tab_content` |
| Breadcrumb toolbar (under tabs) | bg `toolbar.background #282c33`; `py Base06 (6)`, `px Base08 (8)`, `border-bottom 1px #363c46` (border.variant); left items container `min-h 32`, right items `h 32` | | `crates/workspace/src/toolbar.rs` |
| Pane divider | 1px, colour `pane_group_border` = `#464b57` (derived from `border`); drag area = resize handle. Active pane border: **off** by default (`active_pane_modifiers.border_size: 0`, `inactive_opacity: 1`) - there is no visible active-pane marker other than tab text colour. | | `pane_group.rs:1470-1550`, `default.json:88-95` |
| **Status bar** | bg `#3b414d`; `padding Base04 (4)` all sides; `gap Base08 (8)` between left and right clusters; items `gap_1` (4). Height = 22 (Default button) + 8 = **30 @16 / 26.25 @14**. Items: IconButton Small (22x22) for panel toggles (active panel -> icon `#74ade8`, **no bg**), `Button` with **Small 12px** labels for cursor pos, language, etc. Dividers: vertical 16px `border` between panel-button group and others. No border of its own (the 1px above is the workspace container's). | | `crates/workspace/src/status_bar.rs:116-230`, `dock.rs` `PanelButtons` |
| Dock panel | bg `#2f343e`; inner edge border **1px `#464b57`** (`border_r` for left dock, `border_l` for right, `border_t` for bottom); resize handle 6px invisible hit area (fixed). Defaults: project panel 240 wide **docked right**, collab panel 240 right, git panel 360 right, outline 300 right, agent panel dock **left** (flexible) 640, threads sidebar 300 (min 200/max 800) | | `dock.rs:25,1346-1358`, `default.json:880-1205`, `agent_settings.rs:37-38` |
| Panel header row (e.g. collab panel filter) | height = `Tab::container_height` (**32**), `p_2` (8), `gap_1p5` (6), `border-bottom 1px #464b57`; search icon Small Muted; input text 14px, line-height 1.3 | | `collab_panel.rs` `render_signed_in` |
| Sidebar (agent threads) header | height = title-bar height **34**, `border-bottom 1px #464b57`, `px 6`, `gap 4`; section header rows `h = Tab::content_height` (31), `pl 8 pr 6`, 1px transparent border (2px right), focus ring `#2870bd`, hover `#363c46`, active `#454a56`; bg `panel.background` | | `crates/sidebar/src/sidebar.rs` (:2410, :7380-7420) |

### 3.3 Lists, rows and headers

| Component | Metrics | Source |
|---|---|---|
| **`ListItem` (generic row)** | outer `w_full`; inner `px Base06 (6)`, `gap_1` (4); content `gap Base06 (6)`; indent = `indent_level x indent_step_size` (**default 12px**, fixed) applied as `margin-left`; height = content (22.65 for one 14px label) unless `.height()`; spacing: `Dense` (default) no vertical pad, `ExtraDense` -1px top/bottom, `Sparse` +4px top/bottom. Hover bg `#363c46`, active `#454a56`, selected bg `#454a56` (`ghost_element.*`). `inset(true)`: outer `px Base04 (4)` + inner radius `sm` (4) (= menu/picker rows). Disclosure arrow floats at `left: -1rem`. `focused(true)`: 1px `border.focused #47679e` (+2px on the dock side if `.dock()`), `disabled` ignores it. | `crates/ui/src/components/list/list_item.rs` |
| `List` | `py Base04 (4)`; empty message `px_2` + Muted label | `list.rs` |
| **`ListHeader`** (section header) | height **`h_7` = 28 @16 / 24.5** (`h_5` = 20 in Comfortable density); `px_2` (8) if `inset`; gap Base04; disclosure (IconButton Small, Muted) then **Label Default, `Muted`, weight 400, no uppercase**; end slot buttons; selected bg `#454a56`; focus ring like ListItem | `list_header.rs` |
| `ListSubHeader` (menu section label) | row `h_5` (20) + `pb Base04 (4)`, `px Base02 (2)` (+ `px_2` 8 if inset); icon Small Muted; **Label Small (12px) Muted** | `list_sub_header.rs` |
| `ListSeparator` | 1px, `border.variant #363c46`, `my Base06 (6)` | `list_separator.rs` |
| **Project panel row** | wrapper `border 1px` (**right 2px**), bg `panel.background`; border colour = bg colour normally, = **`panel.focused_border #2870bd` when this is the active entry and the panel has focus** (not while the mouse is down); hover bg `element.hover #363c46`; **marked (multi-select) bg `element.selected #454a56`** (per source a plain click clears `marked_entries`, so a single selected entry gets only the focus ring, no fill - read from code, not confirmed visually); `rounded_none`. Inside: `ListItem` Dense, indent step **20px** (setting `indent_size: 20`, fixed), `[chevron 16px Muted][gap 2px][file/folder icon 16px Muted][label]`, label cell `h_6` = **24 @16 / 21**, so row = 24 + 2 border = **26 @16 / 23**. Label Default 14px, colour by git/diagnostic status (`Color::Created/Modified/...`) else `Default`. Folder labels weight 400 (`bold_folder_labels: false`). Git status letters Small. Indent guides: 1px vertical lines, `panel.indent_guide` `#fefef31b`, hover/active `#fffaed2d` (warm defaults). Sticky headers use `panel_overlay_*` (same as panel). | `project_panel.rs` `render_entry` (:6102-6860), `get_item_color` (:655) |
| **Collab panel channel row** (closest Discord analogue) | height **`panel_row_height` = 26 @16 / 22.75** (rem), `ListItem` with `indent_step 20`; icon slot `size_4` (16) centered, **`Hash` (public) / `Lock` icon Small (14) Muted**, then `gap_1` (4) + `pl_0p5` (2), then name Label Default 14px; active channel `toggle_state` bg `#454a56`; keyboard-selected `focused` ring 1px `#47679e` (+2px dock side); hover bg `#363c46`; hover shows right-aligned IconButtons (Small) over a `panel.background`-blended gradient with `rounded_l_md`. Section headers = `ListHeader` at 26px (Label Muted); contacts = `ListItem` + 16px Avatar (+ availability dot). | `crates/collab_ui/src/collab_panel.rs` (:58 `panel_row_height`, :3420-3600, :2955-3135) |
| Sidebar `ThreadItem` row (alt analogue for DMs) | `py_1` (4) `px_1p5` (6), 1px transparent border (2px right), selected bg `#454a56`, hover `#363c46`, active `#454a56`, focus ring `#2870bd`; title row `h_6` (24) `gap_2` (8), icon Small, subtitle Small Muted; radius `sm` if `.rounded`; end-slot controls fade in on hover over a 64-120px gradient | `crates/ui/src/components/ai/thread_item.rs`, `sidebar.rs` |
| Tree indent step summary | project/collab/outline **20px**, generic `ListItem` **12px** (fixed) | |

### 3.4 Controls and small parts

| Component | Metrics | Source |
|---|---|---|
| **Divider** | horizontal: `h 1px`, full width; vertical: `w 1px`, `h_4` = 16 @16; default colour `BorderVariant #363c46` (`Border #464b57` used between panel buttons and call controls); `inset` adds `mx_1p5` (6) / `my_1p5` | `divider.rs` |
| **Disclosure** (expand arrow) | `IconButton`, `IconSize::Small` (14), `Muted`, chevron_right / chevron_down; project-panel uses the `file_icons/chevron_*.svg` (16px) | `disclosure.rs`; `crates/theme/src/icon_theme.rs:436` |
| **Checkbox** | container 20 (fixed); box `size_4` = **16**, radius `xs` 2, border 1px `#464b57` (hover: same @70% alpha), bg transparent (or `element.background #2e343e` when `fill()`), check icon Small coloured `#74ade8`; disabled bg `#2e343e`@60%, border `#363c46` | `toggle.rs` `Checkbox` |
| **Switch** | track **32 x 20** (Base32 x Base20), radius full, thumb **12px** circle (`text` `#dce0e5`; opacity 1 on, 0.5 off, 0.2 disabled), track `px 2`, border 1px; OFF: bg `#2e343e`, border `#464b57`; ON: bg `status.info`@40% = `#74ade866`, border `text.accent`@20% = `#74ade833`; hover blends `text` @16% (on) / 5% (off); outer wrapper `p 1px` + 2px transparent border which becomes `border.focused` on focus | `toggle.rs` `Switch` |
| **Text input (search bars)** | `min-h 32`, `pl 8 pr 4`, **border 1px `#464b57`** (error -> `#d07277`), radius **`md` 6**, no extra fill (sits on toolbar/panel bg); text 14px; right-side option IconButtons `gap_1` | `crates/search/src/search_bar.rs:73`, `buffer_search.rs:223-250` |
| **Keybinding (plain)** | per-key `Muted` text, no chip; macOS shows modifier glyph icons; `gap 4` between keystrokes, per-key radius `xs` | `keybinding.rs` |
| **Keybinding hint chip** (`KeybindingHint`) | **12px italic buffer-font (Lilex)** text `text.disabled #878a98`; chip: radius `sm` 4, `px_0p5` (2), `mr_0p5`, **border 1px = `bg` blended with `text`@16%**, **bg = base blended with `text.accent`@10%**, shadow `0 1px 0 text@8%`; inner keys 10px | `keybinding_hint.rs:207-250` |
| **Avatar** | default **16 @16 / 14** (1rem), `rounded_full`, bg `element.disabled #2e343e` while loading, fallback `Person` icon Small Muted; optional 1px ring (used to knock out the bg); indicator dot bottom-right | `avatar.rs` |
| **Indicator dot** | 6px (`w_1p5`) circle; coloured by `Color`; optional 1px knock-out border in bg colour | `indicator.rs` |
| **CountBadge** | `h_3p5` = 14, `min-w` 14, radius full, `p 1px`, 1px border `#464b57`, bg = `editor.background` blended with `status.error`@40%, label 9px weight 500, `shadow_sm`; "99+" cap; placed absolute top-right of its button | `count_badge.rs` |
| **Scrollbar** | track width **6px** (regular) / 15px (editor); thumb pad 4px; thumb = `scrollbar.thumb.background #c8ccd44c`, hover = `#363c46` solid, drag `#c8ccd44c`; track transparent with `scrollbar.track.border #2e333c` only when a track is drawn; auto-hides (1s delay, 400ms fade); min thumb 25px | `scrollbar.rs` |
| **Indent guides** | 1px wide; `panel.indent_guide #fefef31b`, hover/active `#fffaed2d`; editor guides same defaults | `indent_guides.rs`, section 1.4 |
| **Label** | color via `Color`; `truncate` = ellipsis; underline when used is 1px `text.muted`@40%; `inline_code` = buffer font + bg `#2e343e` + radius 4 + `px 2` | `label_like.rs` |
| `Chip` | `px_1` (4), 1px `border`, radius `sm`, bg `element.background`, buffer-font label, icon XSmall | `chip.rs` |

### 3.5 Overlays

| Component | Metrics | Source |
|---|---|---|
| **Context menu** | `elevation_2` (bg `#2f343e`, 1px `#363c46`, radius 8, 2-layer shadow); **min-width 200px (fixed)**; max-height 75vh, scrolls; inside a `List` -> `py 4`; **line-height forced 1.618**; rows = `ListItem` **inset**: outer `px 4`, inner `px 6`, `gap_1` (4), radius `sm`; item content `[icon Small 14 Muted][gap_1p5 = 6][Label Default]`, `gap_2` (8) to a right-aligned `KeyBinding` (Muted) / chevron_right Small Muted for submenus; row height = 22.65 @16 (Dense) - no vertical padding; hover bg `#363c46`, keyboard-selected bg `#454a56`, disabled text/icon `#878a98`; separators `ListSeparator` (1px `#363c46`, `my 6`); section label = `ListSubHeader` (Small, Muted); submenus open to the side with the same container | `context_menu.rs` (:24, :2379-2500, :1560-1900) |
| **Tooltip** | outer offset `pl_2` + `pt_2p5` (so it never sits under the cursor); box = `elevation_2`, `py_1` (4) `px_2` (8), text Default 14px `#dce0e5`, key binding right with `gap_4` (16); optional meta line = Label **Small Muted**, `max-w_72` (288) | `tooltip.rs:194-234` |
| **Popover** | `elevation_2`, `py` `POPOVER_Y_PADDING/2`, children flush; optional aside = second `elevation_2` card `bg surface.background`, `px_1` | `popover.rs` |
| **Modal layer** | full-window wash = `elevated_surface.background` @ 80% = `#2f343ecc`, click-outside closes; modal anchored `top_20` = **80px** from top, horizontally centred; container = `elevation_3` | `crates/workspace/src/modal_layer.rs:300-335` |
| **Modal header** | `px Base12 (12)`, `pt Base08 (8)`, `pb Base04 (4)`, `gap 8`; headline = `Headline::Small` (16px) **Muted**; dismiss = IconButton Small `X`; body `gap Base08 (8)` | `modal.rs` |
| **Picker / command palette** | width **34rem = 544px**, max-height **24rem = 384px** (both rem -> 476 / 336 @14); container `elevation_3`; input row `h_9` = **36**, `px_2p5` (10), editor text 14px; `Divider` 1px `#363c46` under input; list `py_1` (4); **row (Sparse)**: `ListItem inset` + `py_1`(4) + inner `py_px`(1) -> 22.65 + 8 + 2 = **32.65 @16 (28.8 @14)**; row = `[HighlightedLabel (truncate)] ... [KeyBinding Muted] [history IconButton]`, `gap_2`; selected row bg `#454a56`, hover `#363c46`; **fuzzy-match chars coloured `text.accent #74ade8`** (no bold); separators `border-b 1px #363c46` | `crates/picker/src/render.rs:100-126`, `picker.rs:45-46`, `command_palette.rs:764-811`, `highlighted_label.rs:221` |
| Toast / notification | `elevation_3` | `workspace/src/notifications.rs:343` |

### 3.6 How states are marked

| State | Treatment | Source |
|---|---|---|
| Hover (rows, ghost buttons) | bg `#363c46` | `ghost_element.hover` |
| Pressed | bg `#454a56` | `ghost_element.active` |
| Selected / active list row (collab channel, picker row, menu keyboard-selection) | bg `#454a56`; text unchanged | `ListItem` selected |
| Keyboard focus on a `ListItem` | 1px `#47679e` ring, 2px on dock-facing side | `border.focused` |
| Focused entry in project panel / sidebar | 1px **`#2870bd`** ring (2px on right edge), bg unchanged; ring hidden while mouse is down | `panel.focused_border` (default blue-8) |
| Toggled IconButton (panel toggle, filter) | icon -> `#74ade8`, no background | `IconButton` `Color::Selected` |
| Tinted toggle (mic muted etc.) | `status.<x>.background` fill + `status.<x>` icon | `ButtonStyle::Tinted` |
| Disabled | text/icon `#878a98`, bg `#2e343e`, border `#414754`; `cursor: not-allowed` | |
| Inactive pane | tab text dims (`#a9afbc` / `#878a98`); no overlay by default | `item.rs:143` |
| Drag-over drop target | bg `#83899480`; tab drop edge 2px `drop_target.border` | `drop_target.*` |
| Search match | `#74ade866`; active match `#e8af7466` | `search.*` |
| Link hover | text `#74ade8` | `link_text.hover` |
| Text selection | `#74ade83d` | `players[0].selection` |


## 4. Signature visual traits (what makes it Zed)

1. **Three-step depth ladder, lightest at the edges**: frame/chrome `#3b414d` (title bar, status bar) > panels/tab strip/menus `#2f343e` > editor `#282c33`. The editor is the *darkest* surface, not the lightest; the active tab and breadcrumb toolbar share the editor colour so the active tab visually merges into the content.
2. **1px hairlines, two strengths**: structural `#464b57` (dock edges, tab separators, under title bar / above status bar, panel header rows, inputs) and soft `#363c46` (menu/tooltip/modal outlines, toolbar underline, separators, outlined buttons). Docked UI has no shadows; only floating surfaces (menu, tooltip, popover, modal) get small, low-alpha layered shadows (2 or 4 layers, max blur 12px, max alpha .12).
3. **Square docked chrome, rounded floating chrome**: tabs, bars, panels, panel rows are radius 0; buttons/rows highlights 4px; inputs 6px; every floating card 8px; avatars/switch/badges fully round.
4. **Flat ghost buttons**: transparent at rest, `#363c46` hover, `#454a56` pressed, 4px radius, 22px tall, 14px icons in Muted grey; "on" state = icon turns accent blue (no fill), error/warning/etc. use a 10% tint + coloured icon.
5. **Neutral selection, blue only for focus**: selected/active rows are a lighter neutral `#454a56` (not accent); keyboard focus is a thin blue ring (`#47679e` on list items, `#2870bd` on panel rows), 1px with a thicker 2px edge on the side facing the dock.
6. **Accent is rare** (`#74ade8`): toggled icons, fuzzy-match letters in pickers, links, Switch ON (40% tint), text selection (24%), info tints, search match (40%).
7. **Tabs**: flat rectangles divided by hairlines; **no hover background**; close "x" appears only on hover; inactive tabs have a bottom hairline, the active one does not; inactive tab text `#a9afbc`, and when the whole pane loses focus the active label dims to `#a9afbc` and others to `#878a98`.
8. **Typography is quiet**: IBM Plex Sans 14px weight 400 for nearly everything; 12px for status bar / title bar / secondary text; section headers are the *same size and weight* as items, just `Muted`; **no uppercase, no bold, no letter-spacing**; there is no 500/700 face. Code, keybinding hints and chips use Lilex. UI ligatures disabled.
9. **Golden-ratio line height (1.618)** everywhere (airy), with controls fixed at 22px (≈ one label line) and rows of 22.65 (menus) / 26 (panels) / 32.65 (picker).
10. **Small, line-based icon language**: 16px grid, 1.2 stroke, round caps, drawn at 14px in chrome, Muted by default.
11. **Menus/pickers**: inset rows (4px gutter, 4px-rounded highlight), 6px-margin separators, muted right-aligned key bindings; picker = 544px wide card, 36px input row + hairline, accent-coloured match letters.
12. **Key-hint chips**: tiny italic monospace, 4px radius, border/bg derived by blending the text colour (16%) and accent (10%) over the surface, 1px bottom shadow.
13. **Switch / checkbox**: 32x20 pill with soft-tinted track and a 12px light thumb (dim when off); 16px square checkbox with 2px radius and hairline border.
14. **Scrollbars** are thin (6px), pale 30% thumbs that auto-hide; no arrows.
15. **Dense, low-contrast hierarchy**: text has exactly three greys (`#dce0e5`, `#a9afbc`, `#878a98`) plus accent; icons follow the same three.
16. **Frame vs. content**: title bar (34px) and status bar (30px) are the same lighter slab; macOS traffic-light inset (78 or 71px) is baked into the title-bar layout.

### Suggested analogs (derived from the source, for your mapping)

| Discord element | Closest Zed element to copy |
|---|---|
| Channel list row | collab panel channel row: 26px, `#` icon Small Muted, name 14px, active bg `#454a56`, hover `#363c46`, 20px indent, keyboard ring `#47679e` |
| Category header | `ListHeader` (28px) / collab section header (26px): 14px Muted, disclosure chevron Small, hover-revealed `+` IconButton |
| Server/channel header, search box row | collab filter row (32px, `p 8`, bottom hairline `#464b57`) or sidebar header (34px) |
| Channel top bar / tab strip | tab bar 32px `#2f343e` + toolbar `#282c33` with `#363c46` underline |
| User/voice panel (bottom-left) | status bar (30px, `#3b414d`, 12px labels, 22x22 icon buttons) or title-bar call controls (mic/headphone IconButtons, muted = Tinted(Error)) |
| Member list rows | contact `ListItem` with 16px circular Avatar + 6px availability dot |
| Right-click menus | context menu spec (200px min, inset rows) |
| Quick switcher / emoji picker | picker (544px, 36px input row, 32.65px rows) |
| Message composer / search inputs | search input: 32px min height, 1px `#464b57`, 6px radius |
| Tooltips | `tooltip_container` (8px radius, `py 4 px 8`, meta line Small Muted) |
| Toggles | Switch/Checkbox specs |
| Scrollbars | 6px pale thumb |
| Unread/mention badges | `CountBadge` (14px pill, error-tinted) and `Indicator` dot (6px) |

## Appendix - provenance, limits, caveats

* **Everything is read from source, not measured on screen.** I did not screenshot Zed.app. Items worth a visual sanity-check before locking CSS: (a) the single-selected project-panel entry (source says ring only, no fill), (b) toolbar height (source: left container `min-h-8`, i.e. 32px + 12px padding), (c) real `ui_font_size` of your install (default 16; set `ui_font_size` in `~/.config/zed/settings.json` to confirm - I did not read your settings).
* One Dark JSON (`assets/themes/one/one.json`) and every cited Rust file are identical between `main@c7bea34` and the `v1.27.0` tag that matches the installed app (see header table).
* Zed stores colours as sRGB; "blend" operations (`Hsla::blend`) are straight source-over alpha compositing in RGB (`crates/gpui/src/color.rs:58`), so rgba() in CSS reproduces them.
* `ThemeColors::dark()` defaults are Radix scales with **warm `sand` neutrals**; only the keys listed in 1.4 fall back to them (`panel.indent_guide*`, `editor.indent_guide*`, `drop_target.border`, `debugger_accent`, `terminal.ansi.background`, vim/helix). Everything else is One Dark's own blue-grey.
* Not covered because they are not part of the chrome: editor gutter geometry, minimap, diff hunks (palette only), terminal cell metrics, onboarding/welcome, settings UI, agent panel internals.
* Reproduce: `git clone --depth 1 --filter=blob:none --sparse https://github.com/zed-industries/zed.git && git sparse-checkout set assets crates/ui crates/workspace crates/theme crates/title_bar crates/platform_title_bar crates/project_panel crates/collab_ui crates/picker crates/command_palette crates/sidebar crates/gpui_macros crates/ui_macros crates/theme_settings`.
