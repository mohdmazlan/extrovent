# Proposal: Facebook-like Profile Flow

## Why

Top-bar `name + avatar` is static and `/profile` is an edit form, while every feed card shows a plain avatar/name that doesn't navigate. Users expect facebook parity: click header → menu → profile view with own feed, and click any feed avatar/name → that user's profile with feed + Add Friend. Making `/profile` the view unifies mental model now that the shell is app-faithful.

## What Changes

- **Header avatar menu (facebook-like):** `AppShell` `name+avatar` becomes a dropdown trigger (nickname/initials). Click → menu `View profile → /profile`, `Settings → /settings`, `Logout`. `Esc` + outside click + backdrop dismiss, focus trap, `aria-haspopup/menu`, no sidebar duplication.
- **BREAKING: `/profile` becomes view, edit moves:** `/profile` renders `ViewProfilePage` in self mode: banner blur, avatar 100, nickname `@{user_id}`, `total_posts`/`total_friends`, `Edit profile → /profile/edit`, posts tab `My posts` (`GET /post/my` or `GET /post/list?user_id`). Current edit form (`ProfilePage.tsx:23` 7 fields) moves to `/profile/edit`; `/profile/edit` retains saving. Optional redirect `old ? user_id edit → /profile/edit` for bookmarks.
- **Feed → profile:** `FeedPage` `PostCard` avatar + author become `Link`s to `/users/:userId` (self → `/profile`). Same for `Comments` author, `NotificationsPage` actors, `FindFriends` already links. `ViewProfilePage` gains posts section with pagination `listUserPosts(userId, page)` adapter (`GET /post/my?user_id=&page=` falling back to `GET /post/list?page=` client-filter).
- **Add Friend stays:** `ViewProfilePage` `FriendButton` 4-state `none/pending_outgoing/pending_incoming/friends → Add/Cancel/Accept+Decline/Message → /chat/:roomId` remains, now reachable from feed via profile.

## Capabilities

### New Capabilities
- `web-profile`: Header avatar dropdown, `/profile` view (self feed + edit entry), `/profile/edit` edit, `/users/:id` foreign view with 4-state Add Friend, profile posts adapter.
- `web-feed-profile-links`: Avatars and author names in feed/comments/notifications become navigational links to user profiles (was plain divs).

## Impact

- **Web:** `src/components/AppShell.tsx:34` (replace static div with `HeaderMenu`), new `src/components/HeaderMenu.tsx` + `HeaderMenu.module.scss`, `src/pages/ViewProfilePage.tsx:70` (add `UserPosts` feed `listUserPosts`), `src/pages/ProfilePage.tsx:23` (route move, keep component), `src/pages/FeedPage.tsx:219` (wrap avatar/author in `Link`), `src/lib/posts.ts:26` (`listUserPosts`), `src/App.tsx:91` routes `/profile`→view, `/profile/edit`→edit, `src/styles/layout/_shell.scss` dropdown, `src/components/Sidebar.tsx:6` `Profile` still → `/profile` (now view).
- **Backend:** reuses existing `GET /user/view?user_id=`, `POST /friend/request`, `GET /post/my` (or fallback). No schema change.
- **Risk:** moving `/profile` may break bookmarks — mitigated by keeping `/profile/edit` as explicit edit and adding alias redirect if needed.
