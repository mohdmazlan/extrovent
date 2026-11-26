# Tasks: Enhance Web UI — Stunning SCSS Design System

## 1. SCSS Foundation and Design Tokens

- [x] 1.1 Install `sass` as devDependency and verify `npm install` completes without errors
- [x] 1.2 Create `src/styles/` structure with `abstracts/_variables.scss` (outdoor palette, spacing/typography scales, radii, shadows, motion) and `abstracts/_mixins.scss` (breakpoints, card, truncate) and verify SCSS compiles via `npm run dev`
- [x] 1.3 Migrate `src/index.css` and `src/App.css` to SCSS using tokens and verify `npm run build` succeeds with no visual regressions on Home

## 2. App Shell and Navigation

- [x] 2.1 Build `AppShell` component with sticky header, responsive nav (desktop links + mobile collapse), and centered content container via `layout/_shell.scss` and verify navigation works across all routes on desktop and mobile widths
- [x] 2.2 Integrate `AppShell` into `App.tsx` routing, removing per-page header duplication and verify all pages render inside the shell with active route indication

## 3. Component Library (SCSS Modules)

- [x] 3.1 Create `Button` component with variants (primary, ghost) and hover/focus states via `components/_button.module.scss` and verify variants render correctly in isolation
- [x] 3.2 Create `Card` component with elevated/flat variants and hover lift via `components/_card.module.scss` and verify cards display with correct shadow and spacing
- [x] 3.3 Create `Input`, `Badge`, `Skeleton`, and `EmptyState` components via SCSS modules and verify each renders correctly including loading and empty states

## 4. Polished MVP Pages

- [x] 4.1 Polish Home page with hero section, outdoor-inspired gradients, and responsive grid and verify visual check on desktop and mobile
- [x] 4.2 Polish Feed page with card grid, hover interactions, and skeleton loaders and verify posts load as styled cards with responsive behavior
- [x] 4.3 Polish Events pages (list, detail, create) with card layout and form styling and verify event creation and listing work end-to-end
- [x] 4.4 Polish Places pages with Leaflet map container styling (border, shadow, legend) and coordinate parsing display and verify map markers render correctly at parsed positions
- [x] 4.5 Polish Profile and Search pages with form and results styling and verify profile update and search mixed-type results display correctly
- [x] 4.6 Polish Login/Register pages with centered card form, outdoor branding, and responsive layout and verify auth flow works with styled forms

## 5. Motion, Theming, and Final Verification

- [x] 5.1 Add subtle motion (page transitions, card hover lifts, button transitions within 200ms) via SCSS and verify interactions feel premium without distraction
- [x] 5.2 Refine dark mode via SCSS-generated CSS vars and `prefers-color-scheme` and verify contrast and readability in both themes
- [x] 5.3 Run full visual and functional verification (`npm run build` succeeds, all routes render stunningly, no inline `style={{}}` remains for layout, no functional regressions) and verify all MVP flows still work end-to-end

## Workflow follow-up

- Archive the change after review sign-off on visual quality
- Consider future manual theme toggle as follow-up if needed
