# Design

## Context

See `proposal.md` Why. Current `database/schema.sql` is the single source of truth: `users.id CHAR(36)` UUID PK, all `user_id` FKs `CHAR(36)`, but entity PKs are still `INT AUTO_INCREMENT` (`posts.post_id`, `place.id`, `events.event_id`, `activity.id`, `business_profile.id`, `chatroom.room_id`) with INT FKs pointing at them (`post_image.post_id`, `event_like.event_id`, `participants.event_id`, `chat_message.room_id`, …). Backend creates entities via `lastInsertId()` and casts ids to int (`(int) $data['place_id']`); web types `post_id: number`; app parses ids as int.

## Goals / Non-Goals

**Goals:**
- App-generated UUID PKs on the 6 entity tables, CHAR(36) FKs everywhere they are referenced, single-file `schema.sql` stays the source of truth.
- A migration path that works for both fresh init (trivial) and existing data (backfill mapping).
- API envelope shape unchanged; only id value types change (number → UUID string).

**Non-Goals:**
- No change to `users`/`user_credentials`/session tables (done in `db-user-identity-split`).
- No change to link-table PKs (stay AI per spec).
- No UUIDv7/ULID ordering optimization — v4 strings, same as `users.id` today.

## Decisions

**1. App-generated UUIDs, not DB-generated**
- Rationale: Matches existing `UserService::genId()` pattern; the created id is needed immediately for follow-up writes (e.g. create post → attach images) without a second lookup. DB-side `UUID()` defaults would hide the value from the writer.
- Alternative: `DEFAULT (UUID())` in schema — rejected, writer can't know the id without re-reading.

**2. Fresh schema first, backfill second**
- `schema.sql` is rewritten with UUID PKs/FKs first (fresh `php migrate.php --fresh` works immediately). A separate one-shot backfill script maps existing INT ids → new UUIDs per table, rewriting FK tables in dependency order (entities before their image/like/comment tables), then swaps PKs. Fresh installs never run the backfill.
- Alternative: In-place `MODIFY` with auto-conversion — rejected, INT→CHAR(36) re-keys every PK and breaks FKs mid-flight with no rollback window.

**3. String ids end-to-end, no coercion**
- Backend drops `(int)` casts on entity ids and treats them as opaque strings (validate UUID format only). Web `post_id: number` → `string`; app `int` id fields → `String`. Route shapes (`/post/:id`) unchanged, values become UUIDs.
- Alternative: Accept both int and UUID during transition — rejected, dual-type ids double the test matrix for zero lasting benefit; clean break with backfill instead.

**4. Junction tables keep AI, FK columns widen**
- `post_like.post_id`, `participants.event_id` etc. become `CHAR(36)`; their own `id` stays `INT AI`. Same split as HRMS (`users` string PK, `user_roles` AI).

## Risks / Trade-offs

- **Backfill on production data is the hard part** → Mitigation: backfill script runs per-table in FK order with a verification pass (`COUNT` orphans = 0) before PK swap; full mysqldump backup first; rollback = restore dump.
- **Clients caching numeric ids break** → Mitigation: clean break is spec'd; web/app ship together with backend (same release train as the identity split).
- **UUID index fragmentation on large tables** → Mitigation: tables are small (tens of rows today); revisit v7/ULID only if measured.
- **`chatroom.room_id` and `event_comment.event_id` are VARCHAR but join INT parents** (type mismatch already) → Mitigation: backfill normalizes all three to CHAR(36).

## Migration Plan

1. **Schema:** Rewrite `database/schema.sql` entity PKs/FKs to CHAR(36); `migrate.php` unchanged.
2. **Backfill (existing data only):** One-shot script — per entity table, add UUID column, fill, rewrite child FKs, swap PK, drop old column; verify zero orphans per table before proceeding.
3. **Backend:** App-generated UUID on create; drop int casts; `php -l` + signup/login/post/feed smoke on fresh DB.
4. **Web/App:** String ids throughout; `npm run build`, `:app:assembleDebug`, login→feed smoke.
5. **Rollback:** Restore pre-migration dump; schema + code revert together (atomic release).

## Open Questions

- None — backfill-vs-reseed for production data is answered by shipping both paths (backfill script for existing data, fresh init for new installs).
