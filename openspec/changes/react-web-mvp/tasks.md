# Tasks: React Web MVP

## 1. Phase 0 — Backend CORS Prerequisite

- [x] 1.1 Add `Access-Control-Allow-Origin` (from `.env` allowlist), `-Methods`, and `-Headers` plus `OPTIONS` preflight handling in `backend/public/index.php`, and verify with `curl -sI -X OPTIONS http://localhost/api/auth/login -H "Origin: http://localhost:5173"` showing the allow headers
- [x] 1.2 Verify a real cross-origin browser call works end-to-end (login from the Vite dev origin returns tokens with no CORS errors in the console) (verified server-side: preflight 204 + ACAO on actual POST/GET responses for the allowlisted origin, none for unlisted origins; no browser available in this environment for a console check — confirm on first `npm run dev` run)

## 2. Phase 1 — Scaffold, API Client, Auth Shell

- [x] 2.1 Scaffold `extrovent_web/` with Vite React-TS, `VITE_API_URL` config, and Leaflet + react-leaflet dependencies, and verify `npm run dev` serves the placeholder app with no build errors
- [x] 2.2 Implement the single `apiClient` (Bearer injection, `{success, data, error}` unwrap, refresh-once-and-retry on 401, force re-login when refresh fails, 429 message surfacing) with unit tests mocking fetch, and verify the suite covers: header present, envelope unwrap, one-retry cap, and re-login on refresh 401
- [x] 2.3 Build login/register/logout screens plus startup session check against the live backend, and verify: bad credentials show the server message, protected call after login succeeds, expired-token refresh is transparent, and logout revokes server-side (reuse returns 401) (verified live: "Invalid password" surfaced, profile 200, logout 200, reuse 401 "Token has been revoked"; refresh-on-expiry path covered by apiClient unit tests + earlier live refresh verification)

## 3. Phase 2 — MVP Feature Slices

- [x] 3.1 Build the post feed slice (list with paging, like, comments) against `post/list`, `post/like`, `post/comment(s)`, and verify each action round-trips against the live backend (verified live: list 20 rows, like toggle 0→1→0, comment post+read; fixed 4 backend bugs found on the way: dispatch arg misalignment, getAll bad correlation + missing WHERE + ONLY_FULL_GROUP_BY violation + never-bound like user, missing datetime on like/comment inserts)
- [x] 3.2 Build the events slice (list, view, create, join, liked/my) against the `event/*` routes, and verify create → view → join → liked appears end to end (verified live: created event 9 → viewed → joined → liked listed it → my listed it; fixed 3 backend bugs found on the way: missing create_date/last_update on insert, join/participants pointed at nonexistent table instead of legacy outdoorbuddy_participants, missing datetime on like insert)
- [x] 3.3 Build the places slice (list, view, create) with Leaflet markers parsed from the `coordinate` string against the `place/*` routes, and verify a created place renders at the right position (verified live: created place 4 with 3.13900,101.68690 → viewed back as 3.139,101.6869; fixed 3 backend bugs found on the way: POINT column written as plain string + missing create_date/last_update/verified on insert, binary WKB coordinate returned to clients, same fix applied to read + update paths)
- [x] 3.4 Build profiles (view/update) plus unified search against `user/*` and `search`, and verify update persists and search returns mixed-type results (verified live: nickname updated to test value and read back, then restored; `search?q=test` returned places/events/activities/users buckets)

## 4. Integration and Sign-off

- [x] 4.1 Run the full user journey (register → login → browse feed → create event → create place → search → logout → reuse blocked) against the live backend and verify every step, then confirm none of the deferred areas (ratings, notifications, invites, uploads, chat) shipped (verified live end-to-end with throwaway user webmvp_e2e, fully cleaned up after; grep confirms zero deferred-area code in src/)

## Workflow follow-up

- Archive the change after review sign-off on all four groups
- Deferred areas become backend follow-ups per the Android matrix gap list, serving both clients
