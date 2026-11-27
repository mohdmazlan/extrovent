# Design

## Context

`extrovent_web` is a Vite + React + TypeScript app (`react-router-dom`, `Leaflet`/`react-leaflet`, SCSS 7-1, `apiClient` with Bearer/refresh envelope unwrapping). It covers 6 read-mostly slices (feed, events, places, search, profile, auth). `extrovent_app` drives 31 Activities + 5 Fragments over `extrovent.mikael.my/api` plus raw socket `:1000` for chat and FCM for notifications, with multi-image `FormData` background uploads and category-specific map icons. Web must reach parity without a backend rewrite — using only existing or already-documented endpoints, adding thin `lib/` adapters and `socket.io-client` for realtime, keeping the current SCSS tokens and `AppShell` layout. See `proposal.md` for why and `specs/*` for what.

## Goals / Non-Goals

**Goals:**
- Single Leaflet explorer replaces the static `HomePage` for authenticated users while preserving the marketing hero for guests.
- One activity, one business-profile, one social-graph, one chat/notifications, one posts-media, one ratings capability set — each independently shippable behind its own routes.
- Reuse `apiClient.ts:116` wholesale; extend `lib/places.ts:21` / `events.ts:27` patterns for new domains; no per-screen token handling.
- Real chat via `VITE_SOCKET_URL` with polling fallback so feature works even if socket is absent.

**Non-Goals:**
- FCM/native push (service worker stretch goal only).
- Admin approval or payment flows beyond displaying `fee`/`verified`.
- Replacing Leaflet with Google Maps (would add keys/cost).
- Backend schema changes — additive `lib/` mapping only; divergence documented per call.

## Decisions

**1. Route layout — new explorer owns `/` when authed.**
`HomeProtected` currently renders `HomePage` hero. Keep hero for guests; for authed users render `ExplorePage` at `/` with `/explore` alias. `AppShell` nav expands to `Explore · Feed · Activities · Events · Places · Chat · Notifications · Search · Business · Profile`. Alternatives considered: separate `/explore` only — rejected, breaks the app's "home is the map" mental model.

**2. Lib layer — one module per domain, `FormData` where the app uses it.**
Add `lib/activities.ts`, `lib/business.ts`, `lib/friends.ts`, `lib/chat.ts`, `lib/notifications.ts`, `lib/ratings.ts`, `lib/uploads.ts`. Each mirrors the existing `places.ts`/`events.ts` shape: `list/get/create/update/remove` + `parse*` helpers. Uploads use `apiFetch` with `Content-Type` omitted for `FormData` (add `apiFetch` branch to not force `application/json` when body is `FormData`). Alternative: JSON base64 (app legacy for avatar) — kept for avatar path only; media uses `FormData` as app's `UploadService3`.

**3. Map — extend `PlaceMap.tsx:25` into `MapExplorer.tsx`.**
Single `MapContainer` with `MarkerClusterGroup` (`leaflet.markercluster`), mode state (`places|events|activities`), chip bar, `useMapEvents` click-to-pin, `GeolocateButton`. Category icons via `getIconFor(category)` switch matching `ListPlace.getIcon()`. Click routes via `type` discriminator (`place_id/event_id/activity_id`). Alternative: Google Maps — rejected due to key management and existing Leaflet usage.

**4. Chat realtime — `socket.io-client` with 401-transparent reconnect, polling fallback.**
Socket connects with `auth: {token: accessToken}`. On `401`, refresh via `refreshTokens()` then reconnect. If `VITE_SOCKET_URL` absent or `io()` fails, fallback to 8s polling of `GET /chat/messages`. Typing uses `start_typing/stop_typing` JSON with 1s `setTimeout` debounce matching `ChatroomActivity:47` `Handler typingTimeout`. Alternative: native `WebSocket` — socket.io gives reconnection for free; native would require manual backoff.

**5. Posts/media — `ImageCarousel` + `VideoPlayer` + `ImageViewer` modal.**
`ImageCarousel` wraps `viewPager` dots for `multiple`; `VideoPlayer` is HTML5 `<video>` with fullscreen via `requestFullscreen`; `ImageViewer` is a portal modal with `transform: scale/pan` (reuse app `Touch` logic). Gallery page reuses same `FormData` uploader as `CreatePostPage`.

**6. Ratings/Notifications/Friend actions — dialog/item components, optimistic updates.**
`RatingDialog` (stars + optional comment), `NotificationItem` with type switch, `FriendButton` with 4-state machine. All do optimistic UI then reconcile on API error, matching Android's optimistic add paths.

**7. Styling — reuse `styles/abstracts/_variables.scss` tokens + `components/*.module.scss` patterns.**
New pages/components get `.module.scss` with `card(elevated)`, `skeleton`, `Badge forest/amber/sky` already in use. No new design system work.

## Risks / Trade-offs

- **Scope breadth (8 capabilities)** → Mitigation: ship vertically per capability (spec order below); each has its own routes and can be reviewed/merged independently; `router` tables guarded by feature flags.
- **Backend endpoint divergence (`coordinate` opaque string, image endpoints)** → `parseCoordinate` already exists in `places.ts:38`; replicate helpers per domain and add adapter unit tests; document 404 fallbacks via `EmptyState`.
- **Socket availability (`:1000` raw vs `socket.io`)** → fallback polling guarantees functionality; feature flag `VITE_SOCKET_URL` keeps local dev working without socket.
- **Map clustering perf with hundreds of markers** → `leaflet.markercluster` with `chunkedLoading: true`; paginate `list` calls where backend supports `?page=`.
- **File uploads large / multi-image** → cap 5 images, 10MB each client-side, show `progressBar`; server `413` surfaced via `ApiError` toast.
- **Friend state race (double tap)** → disable button while `POST /friend/request` pending; refetch on failure.

## Migration Plan

1. Add new `lib/` modules and `apiFetch` `FormData` branch — no route changes, safe to deploy.
2. Add routes progressively: `/activities` → `/business` → `/users/:id` + `/friends/*` → `/chat` → `/notifications` → `/feed/new` + viewers → ratings overlays. Each PR adds its `pages/` + `specs` and extends `App.tsx` `Routes` under `ProtectedLayout` (or outside for viewer modals).
3. Flip `/` to explorer for authed users behind a one-line `HomeProtected` switch; guest hero untouched. Rollback is reverting that line.
4. No DB migration. Feature flags are routes themselves.

## Open Questions

- Socket protocol exact shape (`socket.io` vs raw `Socket:1000` JSON) — the Android raw socket threads use `{type,user_id,room_id,message}` on `PrintWriter`; the web adapter will normalize both shapes in a `chat.ts` `normalizeSocketMessage` helper, so specs need not pin the wire format yet.
- Live `VITE_API_URL` base path for new endpoints (`/activity/*`, `/business/*`, `/friend/*`) — confirm against `extrovent_app` `OutdoorBuddy.java:41` `root` mapping before the first vertical slice, or stub with the same path prefix used by `places/events`.
