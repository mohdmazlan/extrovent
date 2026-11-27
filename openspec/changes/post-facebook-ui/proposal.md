# Proposal: Facebook-like Post UI

## Why

Feed `PostCard` today is a simple `card(elevated)` with `avatar 40 extrovent-gradient`, `author` `date`, `caption`, `ImageCarousel/VideoPlayer`, and pill `♥ Like · count`. It lacks the facebook density: compact header with handle, verified, time, `⋯ More`, content link, media grid, stats row, divider, icon actions (heart/comment/share) with counts, and whole-card click → post detail. Merpati `web/src/components/PostCard.tsx:121` already proves the pattern; Extrovent needs the same for its outdoor community to feel familiar.

## What Changes

- **Post card facebook shell:** `src/components/PostCard.tsx` (new) `article.post-card` `onClick` → `/post/:id` (guard `isInteractive`/`hasTextSelection` like merpati `PostCard.tsx:41`), left `Avatar 40` `Author` `display_name` `@username` `·` `time` `formatTime` (`0s/s/m/h/d` merpati `PostCard.tsx:11`), `VerifiedIcon` if `profile.verified`, right `⋯ More` button, body `post-content` link, `PostMedia` grid, `post-actions-bar` with `Comments` inline + `Like` heart (`PostHeartIcon` `filled`) + `Share` (`PostShareIcon`) plus `formatCount` `K/M` (`PostCard.tsx:27`), divider, hover `background var(--bg-subtle)`.
- **Composer parity:** `src/components/Composer.tsx` facebook-style `avatar 36` + `What adventures, {displayName}?` placeholder pill that opens `CreatePostPage`; `CreatePostPage` already `ViewPager2` → `ImageCarousel` stays, but add header `Avatar + Privacy 🌍` selector like `ExploreKeepAlive`.
- **Feed integration:** `src/pages/FeedPage.tsx:219` swaps inline `postCard` divs for `<PostCard post={p} onPostChange={...} basePath="" />` with `formatTime`/`formatCount` and `VideoPlayer` fallback inside `PostMedia`.
- **Style:** `src/components/PostCard.module.scss` / `src/styles/components/_post-card.scss` `card(elevated)` → facebook `background var(--bg-elevated)` `border 1px var(--border-subtle)` `radius 12px` `shadow-sm`, `post-header` 12px gap, `post-author-name` 15px 600, `post-time` 13px muted, `post-actions-bar` 8px + top divider `var(--border-subtle)`.

## Capabilities

### New Capabilities
- `web-post-card`: Facebook-like post card component with header, media grid, stats, icon actions, whole-card navigation, and accessibility guards.

### Modified Capabilities
<!-- None — web-feed remains list semantics, post-card is new component -->

## Impact

- **Web:** new `src/components/PostCard.tsx` + `PostCard.module.scss` + `PostMedia.tsx`/`Avatar.tsx` reuse, `src/components/Composer.tsx`, `src/pages/FeedPage.tsx:219` + `src/lib/posts.ts:26` types (`author_*`, `likes_count`, `comments_count`, `is_liked`), `src/styles` tokens unchanged (slate-blue `#737BAE` stays as facebook blue analog), no backend change (reuses `GET /post/list`, `POST /post/like`).
- **App:** no change.
- **Risk:** whole-card click may conflict with text selection — mitigated by `hasTextSelection` + `isInteractive` guards copied from merpati.
