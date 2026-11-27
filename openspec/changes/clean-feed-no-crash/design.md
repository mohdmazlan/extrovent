# Design

## Context

See proposal.md - Why. Feed adapters (`UserPostAdapter:80`, `UserUPostAdapter:80`, `EventAdapter:77`, `RatingAdapter:41`, `ImageAdapter:57`) share copy-pasted `LoadingNext/endNext` with `size()-1` + `get(position)` and no empty guard. `ArrayList.get(-1)` throws `IndexOutOfBoundsException`, but code catches `ArrayIndexOutOfBoundsException`, so `UserPostFragment:143` crashes on empty first page. Follow-on issues: `notifyItemChanged` on removed/invalid position, `getAdapterPosition()` without `NO_POSITION` check, `getItemViewType(position)` with `position==-1` in `onViewAttachedToWindow`, per-bind `ViewPager2.registerOnPageChangeCallback` and per-bind ExoPlayer creation.

Constraint from explore: no full OOP rewrite, no arch migration, no behavior change.

## Goals / Non-Goals

**Goals:**
- Empty-safe footer handling in all 5 adapters (single pattern, still per-file, no new base class unless trivial).
- Lifecycle-safe Volley callbacks in `UserPostFragment`.
- Readable guards: early returns, `isEmpty()` checks, named `TYPE_LOADING/TYPE_END`, consistent `Log.e(TAG, String.valueOf(...))`.
- Remove dead commented code blocks in touched methods only.

**Non-Goals:**
- No `BasePaginatedAdapter` extraction, no interface/enum refactor, no Volley singleton, no ExoPlayer pooling, no DiffUtil, no ViewModel. Explicitly deferred.
- No auth, API, or layout changes.

## Decisions

- **Guard instead of abstract:** keep per-adapter `LoadingNext/endNext` shape, add `if (list==null) return; if (isEmpty()) {insert/remove + return;}` at top. Alternative was `BasePaginatedAdapter<T>` — rejected for this change to keep diff reviewable and avoid touching all call sites' generics.
- **Catch `IndexOutOfBoundsException`:** `ArrayList.get` throws via `Objects.checkIndex`, not `ArrayIndexOutOfBoundsException`. Catch the supertype actually thrown.
- **Fix notify pairing:** `remove→notifyItemRemoved`, `add→notifyItemInserted`; never `notifyItemChanged(pos)` after removal or with `pos==-1`. Event/Rating/Image keep `notifyDataSetChanged()` to minimize diff (they already use it).
- **Fragment guard:** `if (!isAdded() || getContext()==null || userPostAdapter==null) return;` + `try{LoadingNext(false)}catch` — Volley callback can fire after detach.
- **`NO_POSITION` + bounds checks:** in delete callbacks and `onViewAttachedToWindow`/`getItemViewType`, return early if `position==RecyclerView.NO_POSITION` or out of range.

## Risks / Trade-offs

- [Risk] `static List + static Activity context` leak remains → Mitigation: out of scope; documented, not touched to avoid behavior change.
- [Risk] ExoPlayer per-bind + callback pile-up remains → Mitigation: out of scope; crash path fixed, perf debt noted for follow-up.
- [Risk] Touching 5 near-duplicate files drifts again → Mitigation: identical guard pattern + tasks checklist per file, verified by single `:app:assembleDebug`.
