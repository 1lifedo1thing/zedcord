# zed-discord

Discord, styled like the [Zed](https://zed.dev) editor in its default **One Dark** theme. It's a layer on top of
[midnight-discord](https://github.com/refact0r/midnight-discord), the same way system24 is.

- IBM Plex Sans UI with Lilex for code and timestamps (Zed's `.ZedSans` / `.ZedMono`)
- flush panes split by 1px borders, no floating cards
- channel list as Zed's project panel: square full-width rows, folder-style categories, indent guides,
  and a filled selection
- chat header as Zed's tab bar, with the channel as the active tab and the topic beside it
- chat as the editor surface: active-line hover, gutter-coloured mono timestamps, the theme's syntax highlighting
- user panel and composer sharing one status-bar line along the bottom, with Vencord's Spotify controls as a
  compact two-row panel section above it
- denser than stock discord, whatever the accessibility settings say: discord's compact spacing scale, 15px chat
  (zed's buffer size) with 32px avatars and tighter groups, a 32px server rail, 40px member / dm / friend rows
  with 24px avatars, and 16px icons in 24px buttons across the header, composer, hover toolbar and status bar
- friends page as a Zed picker (search over inset rows), with Active Now as a dock panel of flat sections, each
  activity indented under its person like a tree row
- Zed's elevated surfaces, small radii and flat ghost buttons for menus, popouts, modals and controls
- flavors for other Zed themes, ported key for key from their theme JSON: **Rosé Pine**
  (`theme/flavors/zed-rose-pine.theme.css`)

## Install (local)

```bash
npm install
npm run dev   # writes the inlined theme to DEV_OUTPUT_PATH (see .env) and rebuilds on change
```

Then enable `zed.theme.css` (or a flavor, e.g. `zed-rose-pine.theme.css`) in Vencord → Themes.

See [DEV.md](DEV.md) for the agent/CDP dev loop.
