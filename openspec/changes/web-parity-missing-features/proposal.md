# Proposal: Web Parity — Close the App Gap

## Why

`extrovent_web` ships 6 routes (feed, events, places, search, profile, auth) while `extrovent_app` drives 31 Activities + 5 Fragments across maps, activities, business profiles, friends, chat, notifications, ratings, and media. Users on web cannot discover activities, browse the map, manage business profiles, add friends, chat, receive notifications, create posts with media, or rate content — the core outdoor-community loop from the Android app is broken on desktop. This change closes that parity gap in one coherent scope so web and app share the same product surface.

## What Changes

Phased delivery, all inside `extrovent_web/src` with no breaking API contract changes (additive `lib/` extensions + new routes). Reuses existing `apiClient` Bearer/refresh, SCSS design system, and Leaflet:

- **Activities domain (missing entity):** `GET /activity/*`, `POST /activity/create`, `GET /activity/ratings` parity with `places/events`. List (`All|Mine|Joined`), detail (hero, meta, description, `PlaceMap` pin, ratings, posts), create (category `Hangout/Hiking/Rafting/Fishing/Cycling/Camping/Gaming/Racing/Others`, coordinate via map pick, description, optional `business_profile_id`, multi-image upload), edit/delete, gallery.
- **Explore/Map:** Replace static `HomePage` hero-only with a real explorer at `/` and `/explore`: Leaflet map with 3 view modes (Places / Events / Activities), category chips (`Restaurant/Gym/Mall/Hall/Others` + `Concert/Tournament` + activity set), filter, My-Location, click-to-stage create (`/places/new?lat=&lng=` etc.), marker clustering, and click-through to detail.
- **Business profiles:** `GET /business/list|get`, `POST /business/create|update` flows. `ListBusinessProfilePage`, `BusinessProfileRegisterPage`, `BusinessProfilePage` (verified/pending badge, `places` link gated on `approved`), `AboutBusinessProfilePage` (inline edit + avatar upload resize 500x500).
- **Social graph:** `FindFriendsPage`, `ViewProfilePage` (`:userId` with blur header, `total_posts/friends`, friend-state `Add/Cancel/Accept/Decline` via `POST /friend/request`, `GET /friend/list`), `InvitePage` (`POST /event/invite`), `ContactPage` reuse.
- **Posts & media create:** `CreatePostPage` (`/feed/new` with `place_id|activity_id|event_id` context, caption, multi-image `FormData` via `POST /post/create` + `POST /post/upload`, `SliderUri` preview), gallery management, `ImageViewer` (pinch/zoom), `VideoPlayer` (ExoPlayer-equivalent HTML5 with fullscreen), infinite feed already exists now supports `image/video/multiple` post types.
- **Comments & ratings:** Dedicated `CommentPage` (`/posts/:id/comments` + `/events/:id/comments`), `RateDialog` for places/activities/events (`POST /place/rate`, `/activity/rate`, `/event/rate`), rating lists with average/count.
- **Chat:** `ChatroomListPage` (`/chat` with Global/Public room `room_id=0` + private rooms) and `ChatRoomPage` (`/chat/:roomId` optimistic send + `Socket.IO` / WebSocket at `VITE_SOCKET_URL` fallback to polling, typing indicators `start_typing/stop_typing` with 1s debounce, FCM-optional polling).
- **Notifications:** `NotificationsPage` (`/notifications` with 5 types: `friend_request`, `invitation`, `chat_message`, `comment`, `custom`; actions `accept/decline` friend, tap-through to comment `post_id`/`chat room`).
- **Edit/Delete + full CRUD wiring:** Update forms for places/activities/events, delete with confirm (`DELETE` endpoints), owner-gated menu (matches `menu_scrolling.xml`).
- **Search upgrade:** Groups already exist; add click-through for `activity` -> `ActivityDetail`, user -> `ViewProfile`, and type headers parity with app.

Explicitly out of this change: FCM native pushes (service worker optional stretch), admin approval flows, payment/fee collection beyond display.

## Capabilities

### New Capabilities
- `web-activities`: Activity entity web surface — list, detail, create, edit/delete, ratings, gallery, and category handling.
- `web-explore-map`: Map-based explorer with mixed modes (places/events/activities), category chips/filter, map-pick to create, and detail navigation.
- `web-business-profiles`: Business profile lifecycle (list, register, view, edit, verified status, avatar, gated places map).
- `web-social-graph`: Social graph — user profiles, find friends, friend requests/accept/decline, contacts, event invites.
- `web-chat`: Chat — room list (public + private), room view with realtime messages and typing indicators.
- `web-notifications`: Notification center with 5 types and inline actions/navigation.
- `web-posts-media`: Posts creation with multi-image/video upload, gallery management, image viewer, video player, dedicated comment pages.
- `web-ratings`: Ratings for places, activities, and events — display, submit via dialog, and rating lists.

### Modified Capabilities
- `user-auth`: No requirement changes — reuses Bearer/refresh contract; only consumes existing auth.
- `web-frontend` (from `react-web-mvp`, not yet archived): Behavior extended via delta specs above rather than editing its archived spec directly; each new capability owns its routes.

## Impact

- **Code:** `extrovent_web/src` only — new `pages/` (`ActivitiesPage`, `ActivityDetailPage`, `ActivityCreatePage`, `ExplorePage`, `Business*Page`, `ViewProfilePage`, `FindFriendsPage`, `InvitePage`, `Chat*Page`, `NotificationsPage`, `CreatePostPage`, `CommentPage`), new `lib/` (`activities.ts`, `business.ts`, `friends.ts`, `chat.ts`, `notifications.ts`, `ratings.ts`, `uploads.ts`), extended `components/` (`ImageCarousel`, `VideoPlayer`, `RatingDialog`, `FriendButton`, `ChatBubble`, `NotificationItem`, `MapExplorer`), `App.tsx` route table roughly doubles, `AppShell` nav grows (Explore, Activities, Chat, Notifications).
- **Backend:** Additive use of existing `apiClient`; expects endpoints already used by Android (`/place/*`, `/event/*`, `/activity/*`, `/post/*`, `/user/*`, `/friend/*`, `/chat/*`, `/notification/*`, `/business/*`, `/rating/*`). Where mismatch exists, proposal documents `FormData` vs JSON negotiation.
- **Dependencies:** `socket.io-client` (or native `WebSocket`) for chat realtime, `leaflet.markercluster` for map clustering; no new native deps. SCSS/design tokens unchanged.
- **Risks:** Scope is large — mitigate by shipping in vertical slices per capability, each behind its own route and independently testable; map and socket are the only new runtime infra.
