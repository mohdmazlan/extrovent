# Proposal: UUID PKs for entity tables (HRMS pattern)

## Why

`users.id` is now a stable UUID, but every other entity still uses sequential `INT AUTO_INCREMENT` PKs (`posts.post_id`, `place.id`, `events.event_id`, …) that leak creation order and can't be generated distributedly. HRMS solves this by giving identity tables string PKs while keeping pure link tables on AI — Extrovent should follow the same split now that `schema.sql` is the single source of truth.

## What Changes

- **BREAKING DB:** Entity PKs become `CHAR(36)` UUID, app-generated (same `genId()` pattern as `users.id`): `posts.post_id`, `place.id`, `events.event_id`, `activity.id`, `business_profile.id`, `chatroom.room_id`. Link/join tables keep `INT AI` (`post_like.id`, `friends.id`, `participants.id`, …).
- **BREAKING DB:** All FKs pointing at converted PKs widen in step (`post_image.post_id`, `event_image.event_id`, `friends` — n/a, already UUID user refs, `chat_message.room_id`, …).
- **BREAKING API:** `post_id`/`event_id`/`place_id`/`activity_id`/`room_id` become UUID strings in responses, query params, and route params (`/post/:id`, `/events/:id`, …). Envelopes unchanged.
- **Backend:** Replace `lastInsertId()` flows with app-generated UUID on create; drop int casts on entity ids.
- **Web/App:** Parse entity ids as strings (login/session `sub` already UUID, unchanged).
- **`database/schema.sql`** updated as the single source; `migrate.php` unchanged (still 1-go import).

## Capabilities

### New Capabilities
- `entity-identity`: Stable UUID primary keys for entity resources (posts, places, events, activities, business profiles, chatrooms), app-generated, non-sequential; link tables stay auto-increment.

### Modified Capabilities
<!-- none — user-auth/android-auth already speak UUID `sub`; no requirement text changes -->

## Impact

- **DB:** `schema.sql` — 6 entity PKs + ~10 FK columns change type; existing numeric ids must be backfilled to UUIDs (one migration or fresh init).
- **Backend:** `PostService`, `PlaceService`, `EventService`, `ActivityService`, `BusinessProfileService`, `ChatroomService` (+ repositories if kept), `index.php` int casts (`(int) $data['place_id']` etc.).
- **Web:** `lib/posts.ts` (`post_id: number` → string), route params, `PostCard`, feed/profile pages.
- **App:** `ListUserPost`, `ListPlace`, `ListItem`, `ChatroomActivity` id parsing `int` → `String`.
- **Risk:** breaking for any client caching numeric ids; old numeric ids need a backfill mapping or a clean reseed. Production data migration is the hard part — fresh `schema.sql` init is trivial, existing-data backfill is not.
