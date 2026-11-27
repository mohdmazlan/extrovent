# Tasks

## 1. DB schema — UUID entity PKs

- [x] 1.1 Rewrite `backend/database/schema.sql` entity PKs to `CHAR(36)` (`posts.post_id`, `place.id`, `events.event_id`, `activity.id`, `business_profile.id`, `chatroom.room_id`) and widen their FKs (`post_image/post_like/post_comment.post_id`, `place_image/place_rating.place_id`, `event_image/event_like/event_comment/event_rating/event_id`, `events.place_id`, `posts.place_id/event_id/activity_id`, `chat_message/chatroom_members.room_id`, `participants.event_id`, `invite.event_id`), keeping link-table `id` as `INT AI`, and verify `php migrate.php --fresh` reports 33 tables
- [x] 1.2 Write one-shot backfill script for existing data (per entity table: add UUID column, fill, rewrite child FKs in dependency order, swap PK, verify zero orphans per table), and verify it on a copy of current dev data with `COUNT` orphan checks at 0

## 2. Backend API — string ids

- [x] 2.1 Update `PostService`, `PlaceService`, `EventService`, `ActivityService`, `BusinessProfileService`, `ChatroomService` to generate UUIDs app-side on create (no `lastInsertId`), drop `(int)` casts on entity ids, and verify `php -l` clean plus signup/login/post/feed smoke passes on a fresh DB
- [x] 2.2 Update `swagger/openapi.yaml` entity id fields from integer to UUID string, and verify the spec renders without errors

## 3. Web — string ids

- [x] 3.1 Update `extrovent_web` entity id types (`lib/posts.ts` `post_id: number` → `string`, route params, `PostCard`, feed/profile/event/place pages) to treat ids as opaque strings, and verify `npm run build` succeeds

## 4. App — string ids

- [x] 4.1 Update `extrovent_app` id parsing from `int` to `String` (`ListUserPost`, `ListPlace`, `ListItem`, `ChatroomActivity`, request/response classes), and verify `:app:assembleDebug` succeeds

## 5. Final verification

- [x] 5.1 Full smoke on fresh DB (`php migrate.php --fresh`, signup/login/post/comment/like/feed by UUID, web login + feed, app login + feed) and verify all green with no numeric entity ids anywhere

## Workflow follow-up

- Archive the change after review with `/opsx-archive db-uuid-entity-pks`
- Verify archived spec appears in `openspec/specs/entity-identity`
