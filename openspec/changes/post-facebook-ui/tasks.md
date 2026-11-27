# Tasks

## 1. Post card component

- [x] 1.1 Create `src/components/PostCard.tsx` faithfully from `merpati/web/src/components/PostCard.tsx:52` (`onPostChange`, `basePath`, `isUserOnline` stub false, `formatTime` 0s/s/m/h/d, `formatCount` K/M, `isInteractive`/`hasTextSelection` guards, `handleCardClick`/`handleCardAuxClick`, `handleLike` toggle `likePost`/`unlikePost`, `handleShare` Web Share → clipboard → new tab, `Avatar`/`Comments`/`PostMedia`/`PostHeartIcon`/`PostShareIcon`/`MoreIcon`/`VerifiedIcon`) with extrovent `Post` → merpati adapter (`id=post_id`, `content=caption`, `media`, `likes_count=total_likes`, `is_liked=!!sliked`), and verify renders with mocked `post`
- [x] 1.2 Create `src/components/PostCard.module.scss` (facebook card: `article.post-card` `background var(--bg-elevated)` `border 1px var(--border-subtle)` `radius 12px` `shadow-sm`, `post-header` 12px, `post-author-name` 15px 600, `post-time` 13px muted, `post-actions-bar` divider, `post-action liked` `filled` heart) and `src/components/PostMedia.tsx` grid wrapper delegating to existing `ImageCarousel`/`VideoPlayer`, plus `src/components/icons.tsx` (`PostHeartIcon`, `PostShareIcon`, `MoreIcon`, `VerifiedIcon`), and verify `vite build` no SCSS errors
- [x] 1.3 Create `src/components/Composer.tsx` pill (`Avatar 36` + `What adventures, {displayName}?`) linking to `/feed/new`, and verify click navigates

## 2. Feed integration

- [x] 2.1 Refactor `src/pages/FeedPage.tsx:219` to render `<Composer />` + `<PostCard post={p} onPostChange={update} />` grid instead of inline `postHeader`/`postBody`/`actions`, keep `listPosts` pagination `Load more`, preserve `ImageViewer` fallback, and verify `formatTime`/`formatCount` show

## 3. Verification

- [x] 3.1 Run `npm run build` and `npm test` (`vitest run`) in `extrovent_web` and verify card click → `/post/:id`, `Ctrl+click` new tab, text selection no nav, `Like` toggle, `Share` fallback, and `More` stub does not break
