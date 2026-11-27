# Proposal

## Why

`extrovent_app` builds on `compileSdk/target 33`, `AGP 8.13.0`, `Gradle 8.14.8`, `Java 1.8`, with `jcenter()` still present. Play requires `target 35`; staying on 33 blocks publishing and latest Android Studio templates.

## What Changes

- Keep `Gradle 8.14.8`, keep/sync `AGP 8.13.0`, repos `google() + mavenCentral()` only (remove `jcenter()`).
- `compileSdk 35`, `buildTools 35.0.0`, `targetSdk 35`, `minSdk 26` unchanged.
- `compileOptions` to `Java 17` (AGP 8 runs on JDK 17), `google-services 4.3.15 → 4.4.2`, `firebase-bom 31.3.0 → 33.x`.
- No code migration, no `ExoPlayer → Media3`, no manifest behavior change.

## Capabilities

### New Capabilities
- None — tooling-only upgrade.

### Modified Capabilities
- None — no spec-level behavior change. This change sets `skip_specs: true` in `.openspec.yaml`.

## Impact

- Affected: `extrovent_app/build.gradle`, `extrovent_app/gradle.properties`, `extrovent_app/gradle/wrapper/gradle-wrapper.properties`, `extrovent_app/app/build.gradle`.
- No API, auth, or feed logic changes. Risk: `target 35` edge-to-edge/background behavior must be smoke-tested; rollback is revert of 4 build files.
