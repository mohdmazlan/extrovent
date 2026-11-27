# Proposal

## Why

Feed screens crash with `IndexOutOfBoundsException: Index -1` when the post list is empty (`UserPostAdapter.LoadingNext`), and the same unsafe footer pattern is copy-pasted across 5 adapters. Code is hard to read (900+ line adapters, 3x duplicated `load()`, dead commented code, string type codes, inconsistent notify calls).

## What Changes

- Harden pagination footers in `UserPostAdapter`, `UserUPostAdapter`, `EventAdapter`, `RatingAdapter`, `ImageAdapter`: null/empty guards, catch `IndexOutOfBoundsException`, correct `notifyItemRemoved/Inserted`, no `notifyItemChanged` on invalid position.
- Add lifecycle guards in `UserPostFragment` (and equivalent feed callers): `isAdded()/getContext()` check before touching adapter from Volley callbacks.
- Add bounds + `NO_POSITION` guards in `onBindViewHolder` / `getItemViewType` / `onViewAttachedToWindow` / delete callbacks.
- Readability cleanup only: early returns, named constants for `TYPE_LOADING/TYPE_END`, remove dead commented blocks, consistent log tags. No behavior change, no full OOP rewrite, no arch migration.

## Capabilities

### New Capabilities
- None — pure refactor/hardening, no new behavior.

### Modified Capabilities
- None — no spec-level requirement changes. This change will set `skip_specs: true` in `.openspec.yaml` (pure refactor).

## Impact

- Affected code: `extrovent_app/app/src/main/java/com/ums/outdoorbuddy/recyclerViewAdapter/{UserPostAdapter,UserUPostAdapter,EventAdapter,RatingAdapter,ImageAdapter}.java`, `fragment/UserPostFragment.java`.
- No API, DB, or auth changes. No dependency changes.
- Risk: low. Verified by `:app:assembleDebug` build.
