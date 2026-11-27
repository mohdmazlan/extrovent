# Tasks

## 1. Theme parity — slate-blue tokens and header plus theme toggle

- [x] 1.1 Rebind `styles/themes/_tokens.scss:4` light `:root` to app colors (`--accent #737BAE`, `--accent-hover #2C4E64`, `--accent-soft rgba(164,204,209,0.18)`, `--accent-ring rgba(115,123,174,0.35)`, `--bg #f7f7f7`, `--text #333`, `--text-muted #888`) and verify `vite build` shows warm grey canvas
- [x] 1.2 Extend `styles/abstracts/_variables.scss:5` with slate aliases (`$color-slate-primary: #737BAE`, `$color-slate-dark: #2C4E64`, `$color-slate-accent: #A4CCD1`) and re-target `hero-gradient`/`forest-gradient` to `extrovent-gradient: 135deg #2C4E64 0%, #737BAE 60%, #A4CCD1 100%`, keep forest vars aliased for compat, and verify `styles/layout/_shell.scss:57` logo uses new gradient
- [x] 1.3 Update `styles/abstracts/_mixins.scss:65` to add `extrovent-gradient` mixin (or retarget `forest-gradient`) and verify `AppShell` logo + `HomePage` hero render slate-blue gradient via visual check in `vite preview`
- [x] 1.4 Update `styles/themes/_tokens.scss:38` dark override to slate soft `rgba(115,123,174,0.12)` instead of forest, add explicit `[data-theme="light"]` and `[data-theme="dark"]` overrides so Settings can override `prefers-color-scheme`, and verify dark `prefers-color-scheme` still shows slate tint in preview
- [x] 1.5 Re-tint `styles/abstracts/_variables.scss:88` shadows base from `rgba(16,24,16)` to `rgba(44,78,100,0.06)` and verify `Card` shadows still render but cooler, via visual check and `npm run build`
- [x] 1.6 Implement `src/lib/theme.ts` handling `extrovent_theme` `light|dark|system` in `localStorage`, setting `document.documentElement.dataset.theme`, listening to `prefers-color-scheme` media query when system, and verify persistence across reload and `data-theme` attribute set
- [x] 1.7 Implement `src/pages/SettingsPage.tsx` (`/settings`) with segmented control Light|Dark|System calling `lib/theme`, styled with `Card` + `Button`, linked from sidebar You group and bottom-sheet More, and verify selection updates theme immediately and persists

## 2. Shell layout — sidebar + bottom nav + grouped navigation

- [x] 2.1 Implement `src/components/Sidebar.tsx` with 240px fixed rail, brand, 4 primary items (Explore/Feed/Notifications/Profile) mapped to `ic_home_ol`/`ic_group_ol`/`ic_bell_ol`/`ic_app_ol` outline vs filled active weight, and collapsible groups Discover (Places/Events/Activities + **Search**), Social (Chat/Friends), You (Business + **Settings**), using `NavLink` `is-active` -> `var(--accent)` and `getUnreadCount` badge on Notifications, and verify renders with mocked auth
- [x] 2.2 Implement `src/components/BottomNav.tsx` 56px fixed bottom bar, 4 unlabeled icon-only items matching `layout_bottom_navigation_view.xml:9` (`itemIconTint`=`bottom_navigation_item_color`, `labelVisibilityMode="unlabeled"`, active indicator pill `var(--accent)`), plus More button that opens a sheet listing Discover/Social/You groups, and verify at 390px the four icons show and More opens/closes
- [x] 2.3 Refactor `src/components/AppShell.tsx:7` to orchestrate rail + bar: import `Sidebar` and `BottomNav`, remove header nav pills (header becomes brand + **search-icon** linking to `/search` + avatar + logout only), keep `listNotifications` 15s polling for badge passed to both Sidebar and BottomNav, hide Sidebar via `respond(lg)` and BottomNav via `respond-min(lg)`, and verify `NavLink` active state works in both and header search icon navigates to `/search`
- [x] 2.4 Refactor `src/styles/layout/_shell.scss:69` to add `.app-shell__body { display:flex }`, `.sidebar` 240px fixed, `.bottom-nav` 56px fixed with `padding-bottom:56px` on `.app-main` for mobile (`@include respond(lg)`), and `labelVisibilityMode` unlabeled `.bottom-nav__label { display:none }` + `currentColor` tint, and verify layout at 1280/1024/390px via `vite build` + manual responsive check
- [x] 2.5 Wire `src/App.tsx` `HomeProtected` and `ProtectedLayout` to keep routes unchanged (`/explore`, `/feed`, `/activities`, etc.) while shell handles grouping — no nav pills remain in header — and verify all 11 nav targets still reachable via sidebar/bottom-sheet and `NavLink` highlights correctly

## 3. Integration and verification

- [x] 3.1 Run `npm run build` and `npm test` (`vitest run`) in `extrovent_web` and verify no type/style regressions and `prefers-color-scheme` light/dark both show slate-blue accent
- [x] 3.2 Manual responsive smoke at 390px, 768px, 1024px, 1280px verifying sidebar visible >1024, bottom bar visible <=1024, header 64/56 minimal, badge updates within 15s, active indicator matches app selected tint `#737BAE`, and `More` sheet lists all secondary routes

## Workflow follow-up

- Archive the change after review requirements are satisfied and specs pass `openspec validate --strict`.
- Verify archived specs under `openspec/specs/` with `openspec list --specs`.
