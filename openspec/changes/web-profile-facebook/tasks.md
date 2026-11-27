# Tasks

## 1. Profile posts adapter

- [x] 1.1 Add `listUserPosts(userId, page, limit?)` to `src/lib/posts.ts:26` trying `GET /post/my?user_id=&page=` then `GET /post/list?user_id=&page=` falling back to `GET /post/list?page=` client-filtered by `post.user_id`, and verify `vitest` covers user filtering and pagination
- [x] 1.2 Add `src/lib/posts.test.ts` (or extend existing) covering `listUserPosts` fallback path and verify `npm test` passes

## 2. Header avatar menu

- [x] 2.1 Implement `src/components/HeaderMenu.tsx` + `HeaderMenu.module.scss` as dropdown anchored to header avatar (View profile → /profile, Settings → /settings, Logout), with outside click, Esc, and focus return handling, reusing `BottomNav` sheet backdrop logic, and verify renders with mocked auth and menu dismisses
- [x] 2.2 Refactor `src/components/AppShell.tsx:34` to replace static `app-header__user` + Logout button with `HeaderMenu` trigger (nickname/initials, `aria-haspopup/menu`, `aria-expanded`), wire `logout` via `AuthContext`, keep search `⌕`, and verify header shows avatar-name that opens/closes menu and `View profile` navigates to `/profile`

## 3. Profile view (self + foreign)

- [x] 3.1 Extend `src/pages/ViewProfilePage.tsx:70` to add posts feed section below header using `listUserPosts`, with `Load more` pagination, skeletons, and `EmptyState` for zero posts, showing `Edit profile → /profile/edit` when `isSelf` and `FriendButton` 4-state otherwise, and verify self vs foreign renders correctly
- [x] 3.2 Keep `src/pages/ProfilePage.tsx:23` as edit component but verify it still saves via `updateProfile` at new route `/profile/edit` and handles all 7 fields, with `npm run build` passing

## 4. Routing and feed links

- [x] 4.1 Update `src/App.tsx:91` routes: `/profile` → view (self mode of `ViewProfilePage`), `/profile/edit` → edit (`ProfilePage`), keep `/users/:userId` → foreign view, and verify `Sidebar` `Profile → /profile` and header `View profile` both land on view with `Edit profile` visible for self
- [x] 4.2 Wrap `src/pages/FeedPage.tsx:219` avatar and author `div`s (and `src/components/Comments.tsx` author if present) in `Link`s to `/users/:userId` (self → `/profile`), and do same for `NotificationsPage` actors where applicable, and verify clicking feed avatar `bob` navigates to `/users/bob` and `Add Friend` is reachable

## 5. Integration

- [x] 5.1 Run `npm run build` and `npm test` (`vitest run`) in `extrovent_web` and verify header menu open/dismiss (Esc/outside), `/profile` shows own feed with Edit entry, `/users/:id` shows foreign feed with FriendButton, and feed avatar click → profile → Add Friend flow works
