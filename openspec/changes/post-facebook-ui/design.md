# Design

## Context

Feed today is `src/pages/FeedPage.tsx:219` inline `postHeader` `avatar extrovent-gradient 40` + `author/date`, `postBody`, `ImageCarousel/VideoPlayer`, pill `♥ Like`. Merpati `web/src/components/PostCard.tsx:121` is article with `onClick` guards `isInteractive`/`hasTextSelection` `PostCard.tsx:41`, `formatTime` `PostCard.tsx:11`, `formatCount` `PostCard.tsx:27`, left `Avatar`, header `display_name @handle · time More`, content link, `PostMedia`, `post-actions-bar` with `Comments` + `PostHeartIcon` + `PostShareIcon`. See proposal for why.

## Goals / Non-Goals

**Goals:**
- Reuse merpati card pattern verbatim to get facebook density with minimal new code.
- Keep extrovent data shape (`post_id`, `nickname`, `avatar`, `user_id`, `caption`, `banner`, `total_likes`, `sliked`) mapped to merpati `Post` (`id`, `author_*`, `content`, `media`, `likes_count`, `is_liked`) via adapter.
- No backend change; whole-card navigation is client.

**Non-Goals:**
- Editing post (`More` menu) — stub only.
- Real `Share` analytics.

## Decisions

**1. Adapter not migration.**
Map `Post` → merpati `Post` inside `PostCard` wrapper: `id=post_id`, `content=caption`, `media=isVideo?[{type:video}] : images`, `likes_count=total_likes`, `is_liked=!!sliked`, `author_*=nickname/user_id`. Keeps `listPosts` unchanged. Alternative — change backend `post` shape — rejected, breaks app.

**2. Whole-card click with guards copied verbatim.**
`handleCardClick` checks `e.button!==0`, `isInteractive(e.target)`, `hasTextSelection(articleRef)` exactly as `PostCard.tsx:76`. `handleCardAuxClick` for middle-click. Alternative — wrap card in `Link` — rejected, breaks text selection and button nesting.

**3. Media: reuse existing `ImageCarousel`/`VideoPlayer` inside new `PostMedia` wrapper.**
`PostMedia` decides grid vs single vs video, delegates to existing components so `ViewProfilePage` media stays consistent. Alternative — copy merpati `PostMedia.tsx` — more code, similar.

**4. Composer: tiny `Composer.tsx` pill, not full editor.**
`Avatar 36` + `Link to=/feed/new` pill mimics facebook `What's on your mind?`; full editor stays `CreatePostPage`. Keeps feed light.

**5. Style: new `PostCard.module.scss` imports `card(elevated)` but overrides to facebook `border --border-subtle`, `radius 12`, `shadow-sm`, `post-header` 12px gap, `post-time` 13px muted, `post-actions-bar` top divider. Reuse `--accent #737BAE` as like red analog `#c0392b` stays for heart filled.

## Risks / Trade-offs

- **Whole-card click vs text selection:** Mitigated by merpati guards; test selection across caption before shipping.
- **Avatar online dot (merpati has `isUserOnline`) — extrovent has no presence:** Show static avatar, omit dot or stub false.
- **Performance with 100 cards each with `useState(post)`:** Keep merpati `memo(PostCard)` to avoid feed re-render on one like.

## Migration Plan

1. Add `PostCard.tsx` + `PostCard.module.scss` + `PostMedia.tsx` + `icons.tsx` (heart/share/verified/more) + `Composer.tsx`.
2. Swap `FeedPage` grid to `<PostCard onPostChange>` + Composer, keep `listPosts` paginator.
3. Smoke: card click, Ctrl+click, text selection no nav, like toggle, share fallback, `vite build` + `vitest` `formatTime/formatCount`.

## Open Questions

- Should `More` open `Edit/Delete` for own posts now or defer? Defer — stub button only, matches proposal non-goal.
