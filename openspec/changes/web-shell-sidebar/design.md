# Design

## Context

Web shell is a single sticky glass header with 11 pill links at `styles/layout/_shell.scss:69`. At `lg 1024px` it slides from the right as a drawer — same chrome for every route. App's `activity_main.xml:8` is `relLayout2` content + `layout_bottom_navigation_view.xml:9` fixed 50dp `BottomNavigationView` 4 unlabeled icons, tinted via `@drawable/bottom_navigation_item_color` and `AppThemeAB`. Tokens are forest green (`2d6a4f`) while app is slate-blue (`737BAE`/`2C4E64`/`A4CCD1`). See `proposal.md` for motivation and `specs/web-shell` + `specs/web-theme` for what.

## Goals / Non-Goals

**Goals:**
- 1:1 app-fidelity shell on mobile, spacious sidebar on desktop, same routes.
- Token swap with zero page logic changes — pages keep `Badge`, `Card`, `Button` but resolve to new hues.
- No new deps, no route renames, preserves `AppShell` badge polling (`Notifications` 15s).

**Non-Goals:**
- Changing `extrovent_app/` (reference only).
- Adding gestures, animations beyond Material3 indicator.
- Theming page content beyond tokens (cards keep structure).

## Decisions

**1. Breakpoint: keep `lg 1024px` (`_variables.scss:5` `$breakpoints`).**
Sidebar `display: none -> flex` at `respond-min(lg)`, bottom bar opposite. Already used for burger. Alternative: 768px — rejected, leaves 1024-1280 with crowded header; app's tablet also keeps bottom bar up to ~1024.

**2. Sidebar 240px fixed + content offset, collapsible disabled for v1.**
Desktop grid: `sidebar 240px` + `main { margin-left: 240px; max-width: 1120px }`. Mirrors many web dashboards, cheap to implement, preserves `container`. Alternative: overlay drawer on desktop (click to open) — rejected, adds state and hides nav like mobile.

**3. Bottom bar: 4 items unlabeled, icon-only, + More sheet.**
Map: Explore (Home `ic_home_ol`), Feed (Post `ic_group_ol`), Notifications (`ic_bell_ol`), Profile (`ic_app_ol`). Uses CSS `color` tint to mimic `itemIconTint` — `currentColor` + `.is-active { color: var(--accent) }` with outline vs filled weight via `font-weight` 400/600. More opens bottom sheet with remaining groups. Alternative: 5-item bar — rejected, breaks app parity.

**4. Header: strip nav pills on desktop, keep on mobile as brand-only + search icon.**
Desktop header: brand + **search icon** (magnifying glass -> `/search`) + avatar + logout. Mobile header: 56px (`$header-height-mobile`), same plus search icon. Search also duplicates as nav item under Discover in sidebar and in the More sheet (decision: app toolbar has search affordance, web users expect it in header; keeping both avoids discoverability loss while preserving 4-item bottom parity). All other nav lives in sidebar/bottom. Keeps `AppHeaderActionBar` parity (`AppThemeAB`).

**5. Tokens: rebind `:root` in `_tokens.scss:4`, keep `_variables.scss` scale.**
`--accent: #737BAE`, `--accent-hover: #2C4E64`, `--accent-soft: rgba(164,204,209,0.18)`, `--accent-ring: rgba(115,123,174,0.35)`, `--bg: #f7f7f7`, `--text: #333`/`--text-muted: #888`. `_variables.scss` `$color-forest-*` retained as aliases but deprecated — new `$color-slate-*` added ( `$color-slate-primary: #737BAE` etc.) and `hero-gradient`/`forest-gradient` retargeted to `extrovent-gradient`. Dark theme tints stay in same hue (`rgba(115,123,174,0.12)`). Add `[data-theme="light"]` / `[data-theme="dark"]` overrides in `_tokens.scss:38` so Settings toggle can override `prefers-color-scheme`. Alternative: hard-replace every `forest-` var — more churn, risk.

**6. Components: introduce `Sidebar.tsx` + `BottomNav.tsx`, keep `AppShell.tsx:7` as orchestrator, add `SettingsPage.tsx` + `lib/theme.ts`.**
`AppShell` renders `Sidebar` (desktop, hidden <=lg via CSS) + `BottomNav` (mobile, hidden >lg) + `main`. Avoids duplicating grouping logic; both read same `NAV_GROUPS` constant (Discover includes Search, You includes Settings). `Sidebar` groups collapsible via `<details>` or simple state. Icons as inline SVGs (outline/filled pair) to match `ic_*_ol` weight switch; fallback Unicode emoji if needed until icons landed. `lib/theme.ts` handles `extrovent_theme` `light|dark|system` in `localStorage`, sets `document.documentElement.dataset.theme`, and listens for `prefers-color-scheme` media query when system. `SettingsPage` segmented control calls it. Alternative: single responsive nav — more CSS complexity, harder to match app fidelity.

**7. Shadows/tints: reuse existing `$shadow-*` but re-tint base to `rgba(44,78,100,0.06)` to harmonize with slate, not recreate.**

## Risks / Trade-offs

- **Sidebar width steals content on 1024-1280** → Mitigation: 240px is narrow; container still centers; could offer collapse toggle later (non-goal now).
- **Bottom bar overlaps content** → Add `padding-bottom: 56px` to `.app-main` on mobile via `respond(lg)`; seen in app `relLayout2 paddingBottom 48dp`.
- **Icon parity imperfect** → Use SVG hand-drawn to `ic_*_ol` weight; tint via `color` matches `bottom_navigation_item_color`. Could later import actual drawable as SVG export.
- **Dark theme contrast with #737BAE on #111** → Tested: 4.5:1 still passes; soft tint 12% keeps readability unlike green shift.
- **More sheet discoverability** → Label "More" + hamburger icon; analytics can tell if users miss it.

## Migration Plan

1. Land tokens (`_variables.scss` new slate vars, `_tokens.scss` rebind incl. `[data-theme]`, `_mixins.scss` `extrovent-gradient`) — no shell yet, safe to deploy, snapshot pages change hue only.
2. Add `Sidebar.tsx` + `BottomNav.tsx` + `_shell.scss` rail/bottom styles, update `AppShell.tsx` to orchestrate (header stripped, groups moved, search icon), add `SettingsPage.tsx` + `lib/theme.ts` + `/settings` route.
3. Smoke: `vite build` + `vitest` + manual 390/1024/1280 breakpoints, verify active indicator, badge stays, search via header + sidebar + More sheet, theme toggle light/dark/system persists, routes unchanged.

## Open Questions

- Persist sidebar collapsed state in `localStorage` or keep always open? Defer — behavior spec does not require persistence; default open matches proposal.
