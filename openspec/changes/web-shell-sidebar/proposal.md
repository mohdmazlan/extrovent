# Proposal: Sidebar Desktop + Bottom Nav Mobile Shell & App Theme Parity

## Why

Web's `AppShell` now squeezes 11 top-nav pills (`Explore`..`Profile`) into one glass header, overflowing at 1024px and hiding everything behind a burger. The Android app solves this cleanly: 4 unlabeled icons in a 50dp bottom bar (`Home`/`Post`/`Notifications`/`Profile` `bottom_navigation_menu.xml:3`) — secondary features live elsewhere (profile, map). Now is the right time to mirror that proven pattern on web and finally replace the forest-green palette with the app's own slate-blue identity (`#737BAE`/`#2C4E64`/`#A4CCD1` `colors.xml:3`).

## What Changes

- **Shell: sidebar on desktop, bottom bar on mobile (faithful to `layout_bottom_navigation_view.xml:9`)**
  - Desktop (`>1024px`): persistent left rail 240px (collapsible), logo + 4 primary items with icons (Explore ~ Home, Feed ~ Post, Notifications, Profile) plus grouped sections *Discover* (Places, Events, Activities, **Search**), *Social* (Chat, Friends), *You* (Business). `Search` also lives as a magnifying-glass icon in the header (always visible, links to `/search`) — mirroring the app's toolbar search — and duplicates under Discover for discoverability. Content `margin-left: 240px`. Top bar keeps only search-icon + avatar + logout — no nav pills.
  - Mobile (`<=1024px`): rail collapses; bottom bar 56px fixed, 4 unlabeled icons exactly as `BottomNavigationView` (`itemIconTint`/`itemTextColor` `@drawable/bottom_navigation_item_color`, `labelVisibilityMode="unlabeled"`), plus a *More* sheet/drawer for secondary items. Search remains in the header icon and inside the More sheet under Discover. Top bar becomes minimal brand + search-icon + avatar.
  - Behavior: same routes (`/explore`, `/feed`, `/activities`, `/events`, `/places`, `/chat`, `/notifications`, `/business`, `/search`, `/friends/*`, `/profile`, `/settings`), `BottomNavigationView`-like active indicator (filled vs outline `ic_*_ol` parity), badge on `Notifications` preserved with 15s polling.

- **Theme: app palette parity + user-controlled light/dark**
  - Rebind tokens: `--accent` `#737BAE` (was `forest-700 #2d6a4f`), `--accent-hover` `#2C4E64`, `--accent-soft` `rgba(164,204,209,0.18)` / `--accent-ring` `rgba(115,123,174,0.35)`, `--bg` `#f7f7f7` (was `#ffffff`/`#fdfbf7`), `--text` `#333`/`#888`. Gradient `extrovent-gradient: 135deg #2C4E64 0%, #737BAE 60%, #A4CCD1 100%` replaces `forest-gradient` on logo/hero. Shadows tinted `rgba(44,78,100,0.06)`. Dark theme re-tints accordingly.
  - **Light/dark toggle in Settings** (new `/settings` page, also reachable from Profile): segmented control `Light | Dark | System`, persisted in `localStorage` `extrovent_theme`, applied via `data-theme="light|dark"` on `<html>` overriding `prefers-color-scheme` (System = follow media query). Matches app's `SettingActivity` light/dark handling but user-controlled.
  - No new dependencies; `leaflet.markercluster`/`socket.io-client` wiring unchanged.

- **Out of scope:** changing routes or API contracts, restructuring page content, touching `extrovent_app/` (reference only).

## Capabilities

### New Capabilities
- `web-shell`: Responsive shell — persistent sidebar on desktop, app-faithful unlabeled bottom nav on mobile, breakpoint grouping, active indicator and badge behavior, search placement (header icon + Discover group + More sheet).
- `web-theme`: Theme parity — slate-blue tokens, page/header/sidebar theming, gradient and shadow updates matching `OutdoorBuddy` colors, plus user-controlled light/dark/system toggle in Settings.
- `web-settings`: Settings page for theme toggle (light/dark/system, persisted) and future preferences.

### Modified Capabilities
<!-- None — web-frontend behavior extended via new shell/theme caps; no existing spec edited -->

## Impact

- **Web:** `extrovent_web/src/styles/abstracts/_variables.scss` (palette + `$sidebar-width`/`$bottom-nav-height`), `styles/themes/_tokens.scss` (`:root` + `[data-theme]` bindings + dark override), `styles/abstracts/_mixins.scss` (`extrovent-gradient` vs `forest-gradient`), `styles/layout/_shell.scss` (rail + bottom bar styles, `AppThemeAB` overlay parity), `src/components/AppShell.tsx:7` (nav grouping, icon rendering, badge, header search-icon), new `src/components/Sidebar.tsx` + `src/components/BottomNav.tsx` (icon map `ic_home_ol`->`Home`, `ic_group_ol`->`Feed`, `ic_bell_ol`->`Notifications`, `ic_app_ol`->`Profile`), `src/pages/SettingsPage.tsx` (light/dark/system toggle) + `src/lib/theme.ts` (persisted `extrovent_theme`), `src/App.tsx` routes (`/settings`, `/search` header wiring).
- **App:** read-only reference (`app/src/main/res/values/colors.xml:3`, `styles.xml:4`, `layout/layout_bottom_navigation_view.xml:9`, `menu/bottom_navigation_menu.xml:3`, `SettingActivity.java:16` for settings pattern).
- **Risk:** rail adds layout shift — mitigated by keeping content container `1120px` and preserving all existing routes behind identical `NavLink` targets.
