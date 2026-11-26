# Design: Enhance Web UI — SCSS Design System

## Context

See proposal.md — Why. Current state: `extrovent_web/` uses inline `style={{}}` on every page (7 pages, no shared layout), `index.css` + `App.css` hold Vite template styles with a purple accent, and no `sass` dependency exists. Vite handles SCSS natively. The MVP slices (feed, events, places + Leaflet, profile/search, auth) are functionally complete, so the design system can be built against real pages.

## Goals / Non-Goals

**Goals:**
- Establish a scalable SCSS architecture that makes the app look premium and outdoorsy, with consistent tokens and responsive behavior everywhere.
- Replace all inline styles with SCSS modules/classes; introduce a reusable component library.
- Keep functional logic, API calls, routing, and auth untouched.

**Non-Goals:**
- Backend changes, API modifications, or new endpoints.
- Migrating to a third-party UI framework (e.g., Tailwind, MUI, Chakra) — custom SCSS gives full control over the outdoor identity.
- Adding new features/pages beyond polishing existing MVP slices.

## Decisions

### Decision: SCSS with 7-1-ish architecture, not CSS Modules alone or Tailwind
**Why:** SCSS gives variables, mixins, nesting, and partials with zero runtime cost and no framework lock-in. Tailwind would require rewriting all markup and imposes its own aesthetic. Plain CSS Modules lack power for tokens/mixins. Vite compiles SCSS out of the box.
**Alternatives:** Tailwind (rejected — heavy rewrite, opinionated look), styled-components (rejected — runtime cost, not needed).

### Decision: Outdoor/adventure palette, not generic SaaS look
**Why:** Product is about outdoor activities, events, places. Earth tones (forest greens, warm stone, sunset amber) + soft gradients + nature-inspired shadows make it feel distinct and premium vs. another purple/gray dashboard. Keeps the "Extrovent" brand memorable.
**Alternatives:** Keep Vite purple (rejected — template leftovers, not branded), neutral grayscale (rejected — bland).

### Decision: `abstracts/` + `base/` + `layout/` + `components/` + `pages/` SCSS structure
**Why:** Scales cleanly. `abstracts` (variables, mixins, breakpoints) never output CSS; `base` (reset, typography) sets globals; `layout` (shell, grid); `components` are `.module.scss` for encapsulation; `pages` only for page-specific overrides. Mirrors proven 7-1 pattern at smaller scale.
**Alternatives:** Single global SCSS file (rejected — unmaintainable past MVP), CSS-in-JS per component (rejected — splits design tokens).

### Decision: AppShell layout with sticky header + responsive nav
**Why:** Every page currently re-creates a header. A single shell removes duplication, gives consistent navigation, and enables future features (user menu, theme toggle) in one place.
**Alternatives:** Keep per-page headers (rejected — duplication, inconsistent nav).

### Decision: Component library as SCSS modules (Button, Card, Input, Skeleton, EmptyState)
**Why:** Encapsulated styles, variant props (`primary`/`ghost`, `elevated`/`flat`), and no global leakage. Easy to extend.
**Alternatives:** Global utility classes (rejected — bloat, no variant logic).

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Style churn touches many files, visual regressions | Keep logic untouched; verify via `npm run build` + manual visual check on all routes |
| Over-designing beyond MVP scope | Stick to polishing existing slices; deferred areas (ratings, chat, etc.) stay out |
| SCSS partial import order issues | Single `main.scss` entry point imports `abstracts` first; Vite handles order deterministically |
| Dark mode contrast failures | Derive dark tokens from light palette via SCSS functions; test with `prefers-color-scheme` |

## Migration Plan

1. Install `sass`, create `src/styles/` structure, migrate `index.css`/`App.css` → SCSS with tokens.
2. Build `AppShell` + nav, replace per-page headers.
3. Build component primitives, then polish pages one by one (Home → Auth → Feed → Events → Places/Map → Profile/Search).
4. Add motion/delight and dark mode refinement.
5. Verify `npm run build` + visual check; rollback is `git revert` (no data migration).

## Open Questions

- Future manual theme toggle vs. `prefers-color-scheme` only — deferred; current SCSS vars support either.
