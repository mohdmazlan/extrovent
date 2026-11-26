# Design: React Web MVP

## Context

See proposal.md (Why). Current state:
- Backend is a Bearer-JWT JSON API (~50 `/api/*` routes) with a `{success, data, error}` envelope, verified live; it sends no CORS headers.
- No web code exists; the repo holds `backend/` (PHP) and `extrovent_app/` (Android) side by side.
- The `android-auth` spec already defines the client auth contract (login → tokens, Bearer header, refresh-once-then-relogin, server-side logout); the web client mirrors it.
- Backend stores `coordinate` as an opaque string; no geospatial queries exist.

## Goals / Non-Goals

**Goals:**
- A Vite + React + TypeScript app in `extrovent_web/` that works against the backend unchanged except CORS.
- One `apiClient` owning all auth behavior so screens never touch tokens.
- Leaflet maps with zero licensing cost or API keys.

**Non-Goals:**
- Deferred areas (ratings, notifications, invites, FCM, uploads, joined-events, other-user profiles, chat) — explicitly out of this change.
- Backend changes beyond CORS headers.
- Shared code with the Android app (different platforms; shared contract, not shared code).

## Decisions

### Decision 1: Vite + React + TypeScript, `extrovent_web/` folder
**Why:** Fast dev server, TS types can be generated from the backend's OpenAPI spec, and a top-level folder keeps the PHP/Android/Node toolchains from interfering.
**Alternative considered:** Next.js — rejected; no SSR need, static hosting is simpler and cheaper.

### Decision 2: One `apiClient` (fetch wrapper) owns all auth
**Why:** Mirrors the Android `AuthenticatedRequest` base-class decision — auth logic (header injection, envelope unwrap, single refresh-and-retry, 401 → re-login, 429 surfacing) lives in exactly one place; screens call typed functions and never see tokens.
**Alternative considered:** Per-screen fetch calls — rejected; duplicates the fragmentation the mobile client already suffers from.

### Decision 3: Access token in memory, refresh token in `localStorage`
**Why:** The backend is header-based with no cookie session, so a same-tab memory store plus persistent refresh token is the standard SPA pattern; the 24h/30d lifetimes match it.
**Alternative considered:** Both tokens in `localStorage` — rejected; widens XSS theft to the short-lived token for no benefit. httpOnly cookies would require backend session support that does not exist.

### Decision 4: Leaflet + react-leaflet with OSM tiles
**Why:** Zero cost, no keys, no billing account; coordinates are opaque strings the client parses into markers — no client-side geo queries needed.
**Alternative considered:** Google Maps JS API — rejected for v1 on cost/complexity; revisit only if map search/places-autocomplete becomes a requirement.

### Decision 5: CORS via backend headers + preflight, origins from `.env`
**Why:** Smallest possible backend touch; origin allowlist in `.env` keeps dev (`localhost:5173`) and prod separate without code changes.
**Alternative considered:** Same-origin reverse proxy — rejected; adds deploy moving parts to avoid a ~10-line header change.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| XSS theft of `localStorage` refresh token | Short access lifetime, single-retry cap, server-side revocation on logout; CSP headers on the static host |
| Backend envelope drift breaks all screens | `apiClient` is the single unwrapping point; typed DTOs generated from `openapi.yaml` catch drift at build time |
| OSM tile usage policy on heavy traffic | Standard tile usage is free for normal volumes; switch tile provider URL (single config) if limits approach |
| Deferred areas tempt scope creep mid-build | Spec requirement pins them out; matrix gaps already name their backend follow-ups |

## Migration Plan

1. Backend CORS edit (headers + `OPTIONS` preflight), origins from `.env`; verify from a browser origin.
2. Scaffold `extrovent_web/` (Vite React-TS), `VITE_API_URL` config, `apiClient` + auth shell; verify login → protected call → refresh → logout against the live backend.
3. Build the five MVP slices in order: auth screens, feed, events, places (+Leaflet), profiles + search.
4. Rollback: static hosting means redeploying the previous build; no backend state to unwind (CORS headers are additive).

## Open Questions

None — toolchain, storage, maps, and CORS approach are decided above. DTO generation tooling (openapi-typescript vs hand-written types) is a Phase 1 implementation detail, not a design fork.
