# Design: Migrate Android App Auth

## Context

See proposal.md (Why). Current state:
- 69 Volley `StringRequest` subclasses hardcode `root + "android_php/<name>.php"` URLs; `root` is `http://<ip>/` from `OutdoorBuddy`.
- Auth per request is just a `user_id` POST param; the stored `login_key` is only read by the disabled `LoginStatus` check.
- `Session` holds `{user_id, login_key}` in plain SharedPreferences `"login_details"`; `OutdoorBuddy` app class re-reads the same prefs for uploads and the notification service.
- Uploads go through raw `HttpURLConnection` multipart code (`AndroidMultiPartEntity`, `Upload*Service` background services), not Volley — headers must be added there separately.
- Backend is Bearer-only with 24h access / 30d refresh tokens, 429 rate limiting, and a `{success, data, error}` envelope.

## Goals / Non-Goals

**Goals (this change — Phase 1):**
- A complete, reviewable mapping: all ~69 request classes → `/api/*` routes, with gaps and parsing impact marked.
- A decided, documented auth-injection design so Phase 2 has no open questions.

**Non-Goals:**
- No app code changes in this change (mapping + design only).
- No backend changes unless the matrix proves an endpoint is missing (then a backend follow-up change, not this one).
- Screen-by-screen response re-wiring (Phase 3).

## Decisions

### Decision 1: Shared `AuthenticatedRequest` base class over per-class `getHeaders()` overrides
**Why:** 69 classes each overriding `getHeaders()` duplicates token lookup, 401 handling, and refresh logic 69 times — the exact fragmentation that made the legacy client unmaintainable. One base class (`extends StringRequest`) injecting the header and owning refresh-and-retry fixes auth in one place; each request class then only declares URL + params.
**Alternatives considered:** Per-class overrides — rejected; minimal structural change but guarantees inconsistent 401 handling across screens.

### Decision 2: Centralize 401 → refresh → retry in the base class
**Why:** Volley delivers 401 to the error listener, so without central handling every Activity would reimplement "refresh then retry once". The base class (or a shared `AuthRequestQueue` wrapper) performs: attempt → 401 → single refresh → retry once → still failing → clear tokens and route to login. One retry only, to avoid loops.
**Alternative considered:** Pre-checking token expiry client-side (decode `exp` before each call) — rejected as the sole mechanism; clock skew makes it unreliable, though it can complement the 401 path as an optimization.

### Decision 3: EncryptedSharedPreferences for tokens
**Why:** Tokens replace `login_key` in the `"login_details"` prefs. They are bearer credentials valid for 24h/30d — materially more sensitive than the old opaque key. `EncryptedSharedPreferences` (AndroidX Security) is the standard store; plain prefs remain for non-secret UI state.
**Alternative considered:** Plain SharedPreferences (status quo) — rejected; a rooted-device read would yield a month-long refresh token.

### Decision 4: Multipart uploads join the same auth path
**Why:** Avatar/banner/post images upload via raw `HttpURLConnection` multipart, bypassing Volley entirely. Whatever token provider the base class uses must be usable from those upload paths too — auth helper lives outside Volley classes (e.g. a `TokenStore` + header builder both Volley and upload code call).
**Alternative considered:** Leaving uploads on a separate auth mechanism — rejected; two token paths will drift.

### Decision 5: Matrix first, code second
**Why:** The known gap list (ratings, `GetImages`/`sid`, notifications, FCM, invites, feedback, `getUPosts`, joined-events semantics) may include endpoints with no `/api/*` equivalent. Sizing and backend follow-ups must be known before Phase 2 starts, or cutover stalls mid-way.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Matrix reveals large backend gaps (ratings, notifications) | Gaps become scoped backend follow-up changes; app ships cutover for covered endpoints first |
| Response-envelope re-wiring (Phase 3) dwarfs auth work | Matrix records per-screen parsing impact so Phase 3 is sized honestly before commitment |
| Silent-refresh loops on persistent 401 | Single-retry cap, then force re-login; never loop |
| `OutdoorBuddy.root` IP-based base URL complicates env switching | Keep `root` mechanism; only the path suffixes change (`android_php/` → `api/`) |

## Migration Plan

**Phase 1 (this change):** Land the matrix + this design. No code, no deploy.
**Phase 2 (later change):** Base class, `TokenStore`, `Session` rewrite, login/logout/refresh wiring, startup validation.
**Phase 3 (later change):** Per-screen envelope migration, ordered by matrix impact.
Rollback per phase is a no-op until Phase 2 ships code.

## Open Questions

None — the base-class-vs-per-class fork is decided above; endpoint gaps are enumerated by the matrix task, not guessed here.
