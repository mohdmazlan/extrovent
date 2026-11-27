# Design

## Context

`AppShell` header is static (`brand | ⌕ | [nickname+avatar] | Logout` `AppShell.tsx:34`) with no dropdown; `/profile` is the edit form (`ProfilePage.tsx:23` 7 fields) while `ViewProfilePage.tsx:11` (`/users/:id`) is the view (blur banner, `FriendButton` 4-state, counters, no posts list). `FeedPage.tsx:219` renders `avatar` + `author` as plain `div`s from `listPosts` paginated global. See `proposal.md` for motivation and `specs/web-profile` + `specs/web-feed-profile-links` for what.

## Goals / Non-Goals

**Goals:**
- Facebook-like entry: header avatar → menu → profile view with self feed.
- Reuse `ViewProfilePage` for both self (`/profile`) and foreign (`/users/:id`) to keep one header; move edit to `/profile/edit`.
- Make every feed avatar/name a `Link` to that user's profile and ensure Add Friend is one click from feed.

**Non-Goals:**
- Changing `POST /friend/request` or backend schema.
- Introducing new avatar image pipeline.
- Redesigning feed card layout.

## Decisions

**1. `/profile` becomes view (A), edit moves to `/profile/edit`.**
Reuse `ViewProfilePage` for self: when `params.userId` absent, derive `user.user_id` from `AuthContext`. Add `isSelf` branch: show `Edit profile → /profile/edit` instead of `FriendButton`. `ProfilePage` stays as component but route changes to `/profile/edit`; alias redirect not needed immediately (old bookmark to `/profile` now shows view, which still has Edit entry). Alternative — keep edit at `/profile` and add `/me` — rejected: then header menu "View profile" → `/users/:id` duplicates, confusion between two profile meanings.

**2. Header menu: new `HeaderMenu.tsx` inside `AppShell`.**
Trigger is the existing `app-header__user` div (now `button` with `aria-haspopup/menu`, `aria-expanded`). Menu is portal to `body` or absolute under header, `View profile` (`/profile`) / `Settings` (`/settings`) / `Logout` (`auth/logout` then clear). Outside click + `Esc` + `focusout` close, `autoFocus` first item. Reuses `BottomNav` More sheet backdrop logic for dismiss. Alternative — reuse `Sidebar` more — rejected: header is sticky, menu is small and anchored.

**3. Feed links: wrap existing `postHeader` divs.**
`FeedPage.tsx:219` currently `div.avatar` + `div.author`; change to `Link to={p.user_id===myId ? '/profile' : `/users/${encodeURIComponent(p.user_id)}`}`. Same for `Comments.tsx:106` author. No change to `listPosts` shape; `p.user_id` already present via `Post` model `src/lib/posts.ts:26` (`post.user_id`). Alternative — fetch profile on hover — not needed.

**4. Profile posts: adapter `listUserPosts(userId, page, limit?)`.**
Try in order: `GET /post/my?user_id=&page=` (parity backend `activity/create` style), then `GET /post/list?user_id=&page=` (HRMS-ish), then fallback `GET /post/list?page=` client-filter `post.user_id===userId`. Extracted to `src/lib/posts.ts:26` `listUserPosts`. `ViewProfilePage` calls it with page state + `Load more`, showing `EmptyState` when zero. Keeps existing `listPosts` untouched.

**5. Friend flow unchanged, just reachable.**
`FriendButton` already 4-state; no logic change. `ViewProfilePage` `onChange` currently `window.location.reload()` — keep for now, later optimistic without reload.

## Risks / Trade-offs

- **Sidebar `Profile` and header `View profile` both → `/profile`:** Duplication is intentional (facebook pattern) — keep both, no confusion once `/profile` is view.
- **Move breaks direct `/profile` edit bookmarks:** Mitigation: header menu + `ViewProfilePage` `Edit profile` button provide one-click edit; add redirect later if telemetry shows hits.
- **Posts adapter fallback may be slow (full list filter):** Mitigation: limit fallback to first 100 client-filtered; real paging when backend supports `user_id`.
- **Menu a11y missed:** Includes `aria-*`, `Esc`, outside click, return focus to trigger — same as `BottomNav` More sheet.

## Migration Plan

1. Add `listUserPosts` + `HeaderMenu` + `ViewProfilePage` posts section (no routing yet) — safe behind imports.
2. Flip routes (`App.tsx:91` `/profile` → view wrapper, `/profile/edit` → `ProfilePage`) and wire `AppShell` trigger + `FeedPage` links — single deploy; rollback is route revert.
3. Smoke: header menu open/dismiss, `/profile` shows own feed + Edit, `/users/:id` shows foreign feed + Add Friend, feed avatar click → profile → Add Friend works, `npm run build` + `vitest` (no new deps).

## Open Questions

- Empty user posts UX copy — defer to `EmptyState` "No posts yet" with `Create post → /feed/new` when self.
