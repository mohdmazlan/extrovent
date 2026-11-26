# Proposal

## Why

Users can only reach the system through the Android app, which itself is mid-migration to the Bearer-token backend. A React web frontend gives users a second way in — desktop-friendly access to feed, events, places, and profiles — while reusing the already-built, already-verified `/api/*` contract instead of waiting on the mobile cutover.

## What Changes

Greenfield web app plus one small backend prerequisite, phased so each step is usable on its own:

- **Phase 0 (backend, tiny): CORS.** The backend currently sends no CORS headers, so any browser app on another origin is blocked before its first request. Add `Access-Control-Allow-*` headers plus preflight (`OPTIONS`) handling, with the allowed origin(s) from `.env`.
- **Phase 1 (web): auth shell + API client.** Vite + React + TypeScript app shell: login/logout, token storage (access in memory, refresh in `localStorage`), one `apiClient` that attaches `Authorization: Bearer`, unwraps the `{success, data, error}` envelope, refreshes once on 401 then forces re-login, and surfaces 429/attempts-remaining messaging — mirroring the `android-auth` client contract.
- **Phase 2 (web): MVP feature slices.** Login/Register, feed (posts, likes, comments), events (list/view/create/join), places (list/view/create with Leaflet markers from the opaque `coordinate` string), profiles + search. Roughly 20 endpoints, all on routes that exist and have been verified live.
- **Explicitly out of MVP:** ratings, notifications, invites, FCM, uploads, joined-events listing, other-user profiles, chat — these need the backend follow-ups already enumerated in the Android mapping matrix, and serve both clients when built.

## Capabilities

### New Capabilities

- `web-frontend`: React web client for the system — auth shell, API client with Bearer/refresh handling, and MVP screens (feed, events, places, profiles, search) with open-source maps.

### Modified Capabilities

<!-- None — no backend behavior changes beyond CORS headers. -->

## Impact

- New code: `extrovent_web/` folder (Vite + React + TS), independent `VITE_API_URL` config; no changes to `extrovent_app/`.
- Backend: CORS headers + preflight only (propose as a small scoped edit, not a behavior change).
- Dependencies: Leaflet + react-leaflet with OpenStreetMap tiles (no keys, no cost); no Google Maps dependency.
- Deploy coordination: web and Android share the backend contract; MVP uses only already-verified endpoints, so no cross-team blocking.
