# Android → Backend Endpoint Matrix (Phase 1)

Source of truth for the cutover. 58 files in `function/serverRequest/` = **57 endpoint classes** + `ServerRequest.java` (raw-HttpURLConnection helper, not a Volley endpoint). All app requests are POST.

Backend route table: `backend/public/index.php` (~50 routes, Bearer-only, method-agnostic dispatch). Verified live 2026-11-26: protected endpoint returns 401/401/200 for no-token/garbage/valid token; refresh returns a new pair then 401 on reuse.

Verdicts: MATCH = same params/semantics (drop `user_id`, add header) · DIVERGENT = same resource, different params/method/shape · MISSING = no backend route.

## Full inventory (57 classes)

| # | Class | Legacy URL | Params | /api target | Verdict |
|---|-------|-----------|--------|-------------|---------|
| 1 | AppzLogin | login.php | user_id, password | auth/login | MATCH (response now tokens, not login_key) |
| 2 | AppzRegister | sign_up.php | user_id, nickname, email, pass1, pass2, gender | auth/signup | DIVERGENT (pass1/pass2 → password/confirm_password) |
| 3 | Chatroom (3 ctors) | chatroom.php | user_id[, user_id2], room_id, process, message | chatroom/list, chatroom/create, chatroom/message(s) | DIVERGENT (process-switch splits across 3+ endpoints) |
| 4 | CheckUserID | checkUserId.php | user_id | — | MISSING (openapi documents user/check-userid but no route exists) |
| 5 | Comment | comment.php | user_id, comment_id, event_id, comment, process | — | MISSING (no event comments; only post/comment exists) |
| 6 | CommentPost | comment_post.php | user_id, comment_id, post_id, comment, process | post/comment + post/comments | DIVERGENT (process switch: add/get/delete) |
| 7 | CreateActivity | createActivity.php | user_id, category_activity, latitude, longitude, name, description | activity/create | DIVERGENT (lat/long vs single coordinate) |
| 8 | CreateActivityRating | createActivityRating.php | user_id, activity_id, rating, [review] | — | MISSING |
| 9 | CreateBusinessUserProfile | createBusinessProfile.php | user_id, company_name, reg_no, description | business/register | MATCH |
| 10 | CreateEvent | createEvent.php | user_id, business_profile_id, category, title, place_id, start_date, start_time, description, [fee] | event/create | MATCH |
| 11 | CreateEventRating | createEventRating.php | user_id, event_id, rating, [review] | — | MISSING |
| 12 | CreatePlace | createPlace.php | user_id, category_location, latitude, longitude, name, description, [business_profile_id] | place/create | DIVERGENT (lat/long vs coordinate) |
| 13 | CreatePlaceRating | createPlaceRating.php | user_id, place_id, rating, [review] | — | MISSING |
| 14 | CreatePost | createPost.php | user_id, caption, [place_id, event_id, activity_id] | post/create | MATCH |
| 15 | DeleteActivity | deleteActivity.php | activity_id, user_id | activity/delete | MATCH (backend dispatch ignores HTTP method) |
| 16 | DeleteImage | deleteImage.php | id, user_id | — | MISSING (repo deleteImages methods exist but are unrouted) |
| 17 | DeletePlace | deletePlace.php | place_id, user_id | place/delete | MATCH |
| 18 | DeletePost | deletePost.php | post_id, user_id | post/delete | MATCH |
| 19 | EventLike | likeEvent.php | user_id, event_id, process | event/like | DIVERGENT (process like/unlike vs server toggle — confirm in Phase 2) |
| 20 | FCMToken | login.php | user_id, password | — | MISSING (class posts creds to login.php; push-token registration has no backend at all) |
| 21 | Feedback | feedback.php | user_id, feedback | — | MISSING |
| 22 | FriendRequest | friendRequest.php | user_id1, user_id2, process | friend/request + friend/accept (+check) | DIVERGENT (process add/remove/accept splits; user_id1/user_id2 naming) |
| 23 | GetActivity | getActivity.php | user_id, activity_id | activity/get | MATCH |
| 24 | GetActivityLocations | getActivityLocation.php | user_id, category | activity/list | DIVERGENT (backend getAll() takes no category filter) |
| 25 | GetActivityRatings | getActivityRatings.php | user_id, activity_id | — | MISSING |
| 26 | GetAllUsers | getAllUsers.php | user_id | user/get-all | MATCH |
| 27 | GetBusinessProfile | getBusinessProfile.php | user_id, business_profile_id | business/get | MATCH |
| 28 | GetBusinessProfiles | getBusinessProfiles.php | user_id | business/list | MATCH |
| 29 | GetContact | getContact.php | user_id | user/contact | MATCH |
| 30 | GetEvent | getEvent.php | user_id, event_id | event/get | MATCH |
| 31 | GetEventLocations | getEventLocation.php | user_id, category | event/list | DIVERGENT (backend filters by place_id, not category) |
| 32 | GetEvents | getEvents.php | user_id, place_id | event/list | MATCH |
| 33 | GetFriendRequest | getFriendRequest.php | user_id | friend/requests | MATCH |
| 34 | GetImages | getImages.php | user_id, sid | — | MISSING (`sid` session-download concept absent) |
| 35 | GetInvite | getInvite.php | user_id | — | MISSING |
| 36 | GetMyJEvents | getJoinedEvent.php | user_id | event/my | MISSING-semantics (`event/my` returns *created* events — verified in EventService; app needs *joined*) |
| 37 | GetNotifications | getNotifications.php | user_id | — | MISSING |
| 38 | GetPlace | getPlace.php | user_id, place_id | place/get | MATCH |
| 39 | GetPlaceRatings | getPlaceRatings.php | user_id, place_id | — | MISSING |
| 40 | GetPlaces | getPlaces.php | user_id, category, business_profile_id | place/list | DIVERGENT (category supported; business_profile_id filter not) |
| 41 | GetPosts | getPosts.php | user_id, page, datetime, [place_id, activity_id, f_user_id] | post/list | MATCH (all filters supported incl. datetime paging) |
| 42 | GetProfile | getProfile.php | user_id | user/profile | MATCH (self only — see ViewProfileDetails) |
| 43 | GetProfileDetails | getProfileDetails.php | user_id | user/profile | DIVERGENT (backend joins user_details; confirm field parity in Phase 2) |
| 44 | GetRatings | getRatings.php | user_id, event_id | — | MISSING |
| 45 | GetUPosts | getUPosts.php | user_id, user_idp, page, datetime | post/list (`f_user_id`) | DIVERGENT (param mapping user_idp → f_user_id) |
| 46 | GetUserPlaces | getUserPlaces.php | user_id, category | place/my | DIVERGENT (backend my-places takes no category filter) |
| 47 | InviteRequest | invite.php | user_id, receiver, event_id, process | — | MISSING (no invite endpoints at all) |
| 48 | JoinEvent | joinEvent.php | user_id, event_id | event/join | MATCH |
| 49 | PostLike | likePost.php | user_id, post_id, process | post/like | DIVERGENT (process like/unlike vs server toggle — confirm in Phase 2) |
| 50 | Search | search.php | search | search | DIVERGENT (param renamed search → q; backend dispatch is method-agnostic so POST still routes) |
| 51 | SearchUsers | searchUsers.php | search | user/search | MATCH (server accepts `search` as query alias) |
| 52 | UpdateBusinessProfileDetails | updateBusinessProfileDetails.php | business_profile_id + dynamic key/value | business/update | DIVERGENT (dynamic pairs; confirm field whitelist in Phase 2) |
| 53 | UpdateBusinessProfilePic | updateBusinessProfilePic.php | business_profile_id, image (multipart) | — | MISSING (service methods exist but are unrouted) |
| 54 | UpdatePlace | updatePlace.php | place_id, user_id, name, description | place/update | MATCH |
| 55 | UpdateProfilePic | updateProfilePic.php | user_id, image (multipart) | user/update-profile-pic | MATCH (multipart) |
| 56 | UpdateUserDetails | updateProfileDetails.php | user_id + dynamic key/value | user/update | DIVERGENT (dynamic pairs vs fixed field list) |
| 57 | UploadPostImage | uploadPostImage.php | post_id, image (multipart, background service) | — | MISSING (no upload route; media serving is GET-only) |
| 58 | ViewProfileDetails | viewProfileDetails.php | user_id, user_id2 | — | MISSING-semantics (backend `user/profile` always resolves the *authenticated* user — viewing other users' profiles is unsupported) |

Totals: 58 endpoint entries listed (57 classes; `ServerRequest.java` is a non-Volley helper, not an endpoint). MATCH 22 · DIVERGENT 17 · MISSING 19 (incl. 2 semantics gaps).

## Backend gaps → follow-ups

| Gap | App classes affected | Proposed follow-up |
|-----|---------------------|-------------------|
| Ratings (create + read, event/place/activity) | CreateEventRating, CreatePlaceRating, CreateActivityRating, GetRatings, GetPlaceRatings, GetActivityRatings, RateEventDialog, RatePlaceDialog, RateActivityDialog | New backend change: ratings endpoints (or explicit wont-fix → drop the dialogs) |
| Notifications (+ list adapter) | GetNotifications, NotificationFragment, NotificationService, ListNotiAdapterInvite | New backend change: notifications endpoints |
| Invites (`invite.php`, `getInvite.php`) | InviteRequest, GetInvite, InviteUsersAdapter, InviteActivity | New backend change or fold into friend/event flow |
| Feedback | Feedback | New backend change or drop (confirm product decision) |
| FCM push registration | FCMToken | New backend change: push-token endpoint (class currently mis-posts creds to login.php) |
| CheckUserID | FragmentCheckUserID | One-line backend change: add the documented `user/check-userid` route |
| Joined-events listing | GetMyJEvents | Backend change: `event/joined` (or extend `event/my` with a filter) |
| Other-user profiles | ViewProfileDetails (+ ViewProfileActivity) | Backend change: allow `user/profile` to accept a target id with privacy rules, or drop the screens |
| Image upload/delete (`uploadPostImage`, `deleteImage`, business banner/pic) | UploadPostImage, DeleteImage, UpdateBusinessProfilePic, Upload*Service ×5 | Backend change: multipart upload + delete routes (design must cover the non-Volley upload path per design Decision 4) |
| GetImages/`sid` session downloads | GetImages, GalleryManageActivity | Fold into upload redesign or drop |

## Response-parsing impact (Phase 3 sizing)

Legacy responses are bare objects/arrays under per-endpoint keys (`data`, `users`, `posts`, `places`, `events`, `messages`, `chatrooms`, `comments`, `notifications`, `images`, per-object `images` arrays). The new envelope is `{success, data, error}` — every consumer must unwrap `data` and branch on `success`.

`new JSONObject(response)` appears 100+ times across ~40 files (Activities, Fragments, Adapters, Dialogs, background services). Phase 3 estimate: **35–40 screens/components plus the 5 `Upload*Service` background paths**, ordered by matrix impact (MATCH rows first — mechanical unwrap; DIVERGENT rows need field remapping; MISSING rows wait on follow-ups).

## Design validation (tasks 2.1–2.3)

- **Wire proof (live, 2026-11-26):** `GET /api/user/profile` with no token → 401 JSON; garbage token → 401; valid Bearer → 200 with profile. `POST /api/auth/refresh` → 200 + new pair; immediate reuse → 401 `Refresh token has been revoked`. `POST /api/auth/logout` → 200; reuse of that access token → 401 `Token has been revoked`. The exact contract the base class will rely on is proven on the wire.
- **Base-class sketch (for Phase 2, not implemented here):** `abstract class AuthenticatedRequest extends StringRequest` overriding `getHeaders()` to inject `Authorization: Bearer <TokenStore.accessToken>`, with a shared error path: on 401 → single `refreshToken()` call → retry original request once → still failing → clear `TokenStore`, route to `LoginActivity`. Volley 1.2.1 supports both override points (`getHeaders()`, `deliverError` interception via a wrapping `ErrorListener`); no `getHeaders` overrides exist anywhere in the app today, so there are no conflicts. **Retry cap: exactly one retry, then force re-login — never loop.** On-device compile/run of this sketch requires the Android SDK (unavailable in this environment) and is carried as the first Phase 2 task.
- **EncryptedSharedPreferences:** `build.gradle` has no `androidx.security` dependency; `minSdkVersion 26` supports `androidx.security:security-crypto:1.1.0-alpha06` (requires 26+) with fallback `1.0.0` (requires 23+). Decision recorded in design.md Decision 3; dependency resolution (offline Gradle) is a Phase 2 entry check.
- **Multipart uploads** (`AndroidMultiPartEntity`, 5 `Upload*Service` classes) bypass Volley: the Phase 2 `TokenStore` must expose a plain header builder both Volley and upload code call (design Decision 4).
