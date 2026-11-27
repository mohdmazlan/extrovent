# Tasks

## 1. Footer hardening

- [x] 1.1 Harden `UserPostAdapter.LoadingNext/endNext` with null/empty guards, `IndexOutOfBoundsException` catch, and correct `notifyItemRemoved/Inserted` and verify no `get(-1)` path remains by reading `extrovent_app/app/src/main/java/com/ums/outdoorbuddy/recyclerViewAdapter/UserPostAdapter.java:80`
- [x] 1.2 Apply same guard pattern to `UserUPostAdapter`, `EventAdapter`, `RatingAdapter`, `ImageAdapter` `LoadingNext/endNext` and verify each file contains `isEmpty()` early return and `IndexOutOfBoundsException`
- [x] 1.3 Guard `UserPostFragment.loadRecylerViewData` callback with `isAdded()/getContext()/adapter null` check and `try{LoadingNext(false)}` and verify by reading `extrovent_app/app/src/main/java/com/ums/outdoorbuddy/fragment/UserPostFragment.java:137`

## 2. Bind and readability cleanup

- [x] 2.1 Add bounds + `NO_POSITION` guards in `onBindViewHolder` / `getItemViewType` / `onViewAttachedToWindow` / delete callbacks for touched adapters and verify empty list no longer reaches `list.get(position)`
- [x] 2.2 Remove dead commented blocks and normalize log tags in touched methods only and verify `git diff --stat` shows only the 6 target files
- [x] 2.3 Run `:app:assembleDebug` in `extrovent_app` and verify `BUILD SUCCESSFUL`

## Workflow follow-up

- Run `/opsx-apply` to implement tasks 1.1-2.3 from this change.
- Archive `clean-feed-no-crash` after review.
