# Tasks

## 1. Foundation — lib, apiClient, and deps

- [x] 1.1 Extend `lib/apiClient.ts` to handle `FormData` (skip forcing `Content-Type: application/json` when body is `FormData`) and add `isFormData` guard; verify `vitest` unit for JSON vs FormData header behavior
- [x] 1.2 Add `lib/activities.ts` (`listActivities`, `getActivity`, `createActivity`, `updateActivity`, `deleteActivity`, `parseCoordinate` reuse) with types `Activity`, `CreateActivityPayload`; verify `vitest` covers URL construction and coordinate parsing
- [x] 1.3 Add `lib/business.ts` (`listBusinessProfiles`, `getBusinessProfile`, `createBusinessProfile`, `updateBusinessProfile`, `updateBusinessAvatar`) with types `BusinessProfile`; verify fetch mapping against app `GetBusinessProfile` response shape
- [x] 1.4 Add `lib/friends.ts` (`getProfileById`, `listFriends`, `findUsers`, `friendRequest {add,accept,remove}`, `inviteToEvent`) and `lib/notifications.ts` (`listNotifications` + type `NotificationItem`) and `lib/chat.ts` (`listRooms`, `listMessages`, `sendMessage`, `normalizeSocketMessage`) ; verify unit tests for envelope unwrapping per lib
- [x] 1.5 Add `lib/ratings.ts` (`getPlaceRatings`, `getActivityRatings`, `getEventRatings`, `ratePlace/Activity/Event`) and `lib/uploads.ts` helpers (`resizeImageTo500`, `uploadPostImages`, `uploadGalleryImages`) with 5-image/10MB caps; verify resize/validation helpers in unit tests
- [x] 1.6 Install `socket.io-client` and `leaflet.markercluster` (+ types), wire `VITE_SOCKET_URL`/`VITE_API_URL` through `extrovent_web/.env.example`; verify `npm install` and `vite build` succeed

## 2. Activities domain

- [x] 2.1 Build `pages/ActivitiesPage.tsx` + `ActivitiesPage.module.scss` with tabs All/Mine/Joined, `Badge` category badges, card grid, `EmptyState`, `SkeletonCard`, and `routes` `/activities`; verify renders with mocked `GET /activity/list`
- [x] 2.2 Build `pages/ActivityDetailPage.tsx` with hero `ViewPager` carousel, `PlaceMap` pin, meta bar, description, rating summary, posts section, owner-gated Edit/Delete menu, and 404 not-found handling via `/:id`; verify detail fetch and delete confirmation flow
- [x] 2.3 Build `pages/ActivityCreatePage.tsx` (and `/:id/edit` reuse) with `Input` title, `Select` category (9 options + `getCategoryList` parity), map pick (`PlaceMap onPick`), description, `business_profile_id` dropdown, fee fields, `FormData` multi-image preview (`SliderUri` dots), validation, and `POST /activity/create` then upload; verify `?lat=&lng=` pre-fill and validation blocking
- [x] 2.4 Add activity gallery sub-route `pages/ActivityGalleryPage.tsx` (`/:id/gallery`) with grid, multi-pick add, and gallery fetch `GET /activity/images?activity_id=`; verify add/upload refresh

## 3. Explore / Map

- [x] 3.1 Build `components/MapExplorer.tsx` (`MapContainer` + `leaflet.markercluster`, mode state `places|events|activities`, chip bar, active filter chip, clustered markers, `getIconFor(category)` icon switch, `onPick` pin) reusing `PlaceMap.tsx:25` patterns; verify mode switch refetches with correct `category` param
- [x] 3.2 Build `pages/ExplorePage.tsx` wrapping `MapExplorer`, `GeolocateButton` (`navigator.geolocation`), click-to-create flow (`Add here` -> `/places|activities|events/new?lat=&lng=`), loading skeletons, `EmptyState` with clear-filter; verify marker click navigates to correct detail by `type` discriminator
- [x] 3.3 Replace authenticated `/` hero with `ExplorePage` in `App.tsx:29` `HomeProtected` (guest hero unchanged, `/explore` alias kept) and extend `components/AppShell.tsx:14` nav to `Explore · Activities`; verify nav highlights and mobile drawer includes new links, `vite build` + manual cross-breakpoint check

## 4. Business profiles

- [x] 4.1 Build `pages/BusinessListPage.tsx` (`/business`) with `GET /business/list` cards, `EmptyState` + `Create CTA`, `FAB` to `/business/new`; verify empty vs populated states
- [x] 4.2 Build `pages/BusinessRegisterPage.tsx` (`/business/new`) with `tilCompanyName/reg_no` required, `POST /business/create`, persist `profile_id`, navigate to detail; verify validation and success flow
- [x] 4.3 Build `pages/BusinessProfilePage.tsx` (`/business/:id`) with header, `verified/pending` icon/badge, owner gated `Edit` -> `/business/:id/edit`, `Places` link gated on `approved` (mirrors `BusinessProfileActivity:28`), sign-out of business context; verify approved vs pending gating
- [x] 4.4 Build `pages/BusinessAboutPage.tsx` (`/business/:id/edit`) with inline `EdittextDialog`-equivalent editors for name/reg/description (`PUT /business/update`) and avatar upload resize 500x500 Base64 via `UploadBusinessAvatar`; verify save shows `Saved` and non-owner hides edit

## 5. Social graph (profiles, friends, invites)

- [x] 5.1 Build `pages/ViewProfilePage.tsx` (`/users/:userId`) with blur header + circle avatar, nickname, `@{user_id}`, `total_posts/friends`, `layoutPost` -> `/users/:id/posts`, `layoutContact` -> contacts, and `components/FriendButton.tsx` 4-state machine (none/pending_outgoing/pending_incoming/friends -> Add/Cancel/Accept+Decline/Message `-> /chat/:roomId`); verify each state calling `POST /friend/request` with optimistic update
- [x] 5.2 Build `pages/FindFriendsPage.tsx` (`/friends/find`) + `pages/ContactsPage.tsx` (`/friends`) with `GET /friend/list` vs `find`, search filter, `ListUser` rows linking to `/users/:id`; verify search debouncing and `EmptyState` CTAs
- [x] 5.3 Build `pages/InvitePage.tsx` (`/events/:id/invite`) listing contacts with per-row `Invite` -> `POST /event/invite {event_id,user_id}` and `Invited` state; verify 404 event guard
- [x] 5.4 Patch `pages/SearchPage.tsx:28` Users group rows to route to `/users/:userId` and Activity group rows to `/activities/:id`; verify Search no longer dead-links

## 6. Chat

- [x] 6.1 Build `pages/ChatroomListPage.tsx` (`/chat`) with pinned `GlobalChat room_id=0` (`Public Chat` header) + `GET /chat/rooms` rooms via `ChatroomAdapter` style rows (avatar circle, name, `lastMessage`, `datetime` via `TimeStr` helper), `ProgressBar`, `Socket` listener for `new_message`; verify realtime append without reload and empty-list hint
- [x] 6.2 Build `pages/ChatRoomPage.tsx` (`/chat/:roomId`) with header (Public/file-private nickname + `typing...`), `ChatAdapter` bubbles sent/received, `TimeStr`, scroll-to-latest, composer (`editText` + `btnSend` + `TextWatcher`-equivalent 1s `stop_typing` timeout), optimistic send `Sending...` -> `POST /chat/message`; verify typing indicator render and optimistic reconciliation
- [x] 6.3 Wire `socket.io-client` connect with `auth:{token}` and refresh-on-401, `socketHost` from `VITE_SOCKET_URL` fallback (default polling `GET /chat/messages?room_id=` every 8s), `type` discriminators `0=typing,1=message`; verify fallback when socket URL absent and reconnection on token refresh

## 7. Notifications

- [x] 7.1 Build `pages/NotificationsPage.tsx` (`/notifications`) fetching `GET /notifications` via `listNotifications`, loading `SkeletonCard` rows, and type switch rendering (`NotificationAdapter` equivalent: friend_request list_noti style, invitation, chat_message, comment list_noti_4 style, custom) with avatar circle, description, datetime; verify 5 types render correctly and `EmptyState` when none
- [x] 7.2 Implement inline actions: `friend_request` `Accept/Decline` -> `POST /friend/request` optimistic disable, `invitation` `Accept` -> event detail, row tap navigations (comment -> `/posts/:sid/comments`, chat -> `/chat/:roomId`, invite -> `/events/:id`, profile -> `/users/:id`); verify actions and navigations
- [x] 7.3 Add unread badge to `AppShell` `Notifications` nav (`span.badge` count from `notifications` unread) and optional polling (15s) with `new_message`-style update; verify badge count updates without page reload

## 8. Posts & media creation, viewers, comments

- [x] 8.1 Build `pages/CreatePostPage.tsx` (`/feed/new`) with avatar pill header, caption `Textarea`, `ViewPager2`-style `ImageCarousel` preview (`components/ImageCarousel.tsx`), multi-image pick (validate 5/10MB), `place_id|activity_id|event_id` context chip from query, submit `POST /post/create` then `uploads.ts` `FormData` sequential upload with progress; verify text-only, with-images, and empty-validation flows
- [x] 8.2 Build `components/VideoPlayer.tsx` (HTML5 `<video>` with `DefaultLoadControl`-equivalent buffering, fullscreen via `requestFullscreen`, 200px->viewport toggle) and `components/ImageViewer.tsx` portal modal (`Touch` pinch/zoom via `transform` scale/pan, close on backdrop/ESC); wire feed `multiple` carousel and detail carousels to open viewers on click; verify fullscreen and zoom/pan
- [x] 8.3 Extend `pages/FeedPage.tsx:84` to render `image|video|multiple` post types (carousel dots for `multiple`, `VideoPlayer` for `video`), reuse existing like/comment logic; verify video/multiple cards and Load More still function
- [x] 8.4 Build `pages/GalleryManagePage.tsx` (`/:type/:id/gallery`) for places/activities with grid + `imgAdd` multi-pick -> `FormData` upload, paginated `GET /images?sid=`; verify add/upload refresh and delete handling
- [x] 8.5 Build `pages/CommentPage.tsx` (`/posts/:id/comments` and `/events/:id/comments` reuse) with `CommentPostAdapter` list, composer `editText/imgSend` optimistic `Sending...` -> `POST /post|event/comment`, `TimeStr` for each row, and back navigation; keep feed inline drawer; verify dual type (`1=post`, `0=event`) fetch

## 9. Ratings and edit/delete parity, search polish

- [x] 9.1 Build `components/RatingDialog.tsx` (stars + optional comment, 1-5 validation, pre-fill from `GET /rating/my` or list) and `components/RatingList.tsx` (avatar, nickname, stars, comment, date); wire to `pages/PlaceDetailPage.tsx:12`, `ActivityDetailPage.tsx`, `EventDetailPage.tsx:12` with avg/count header, `empty` CTA, and `POST /place|activity|event/rate` optimistic update; verify submit, update, and validation blocking
- [x] 9.2 Add owner-gated edit/delete menus to `PlaceDetailPage`, `ActivityDetailPage`, `EventDetailPage` (`Update*` -> respective `/edit` routes with `GalleryManage` link, Delete -> `ConfirmDialog` + `DELETE` then `navigate` home) matching `menu_scrolling.xml` + `ViewLocationActivity:50` pattern; verify non-owner hides controls and delete confirms
- [x] 9.3 Fix `AppShell` and `PlaceCreatePage.tsx:11`/`EventCreatePage.tsx:10` parity nits: place categories include `Mall/Hall`, event category select `Concert/Tournament/Others`, `business_profile_id` dropdown populated, and event `Place ID` becomes searchable picker (link to `ExplorePage` map pick); verify form option coverage and required bindings
- [x] 9.4 Integration verification: `npm run build`, `npm test` (`vitest run`), manual smoke across all new routes, and 404/error empty states; produce `CHANGELOG` slice notes per capability in `openspec/changes/web-parity-missing-features/`

## Workflow follow-up

- Archive the change after review requirements are satisfied and specs pass `openspec validate --strict`.
- Verify archived specs under `openspec/specs/` with `openspec list --specs`.
