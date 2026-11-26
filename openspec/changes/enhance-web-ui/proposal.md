# Proposal: Enhance Web UI — Stunning SCSS Design System

## Why

The React web MVP is functionally complete but visually bare: pages use duplicated inline `style={{}}`, buttons and cards are raw browser defaults, and the only styling is the Vite template's purple accent. Users get a wireframe, not a product. Now is the right time to install a proper SCSS design system — the app shell and all MVP slices exist, so we know exactly what needs to look stunning.

## What Changes

- Install `sass` and migrate `index.css` / `App.css` to SCSS with a 7-1 style architecture (`abstracts/`, `base/`, `layout/`, `components/`, `pages/`, `themes/`)
- Introduce **design tokens** (outdoor-inspired palette, spacing/typography scales, radii, shadows, motion) as SCSS variables + CSS vars for runtime theming
- Replace per-page inline styles with a shared **AppShell** (sticky header, responsive nav, max-width container) and a **component library** (Button, Card, Input, Badge, Skeleton, EmptyState) as `.module.scss` modules
- Polish all MVP pages (Home, Feed, Events, Places + Leaflet, Profile, Search, Login/Register) — card grids, hover/focus states, loading skeletons, responsive breakpoints, dark mode refinement, and page transitions
- Add **motion & delight** — subtle entrance animations, hover lifts, and a cohesive outdoor/adventure visual identity (earth tones, natural gradients, map pin styling)
- No API or backend changes; purely visual/structural styling

## Capabilities

### New Capabilities
- `web-ui`: Visual design system for the web app — SCSS architecture, design tokens, layout shell, reusable components, responsive theming, and polished page styling that makes the product feel premium and outdoorsy.

### Modified Capabilities
<!-- None — `web-frontend` from react-web-mvp is not yet archived, so this change introduces the companion UI capability rather than delta-patching it. -->

## Impact

- Affected code: `extrovent_web/src/` — new `styles/` folder, refactored pages/components to use SCSS modules; `package.json` gains `sass` devDependency; `vite.config.ts` unchanged (Vite handles SCSS natively)
- Dependencies: `sass` only; Leaflet map container restyled but no new map deps; no backend changes
- Risk: Style churn can touch many files — mitigated by keeping functional logic untouched and doing visual regression via build + manual check
