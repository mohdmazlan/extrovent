# Design

## Context

See proposal.md - Why. Current: `extrovent_app/build.gradle:11` AGP `8.13.0`, `gradle-wrapper.properties:3` Gradle `8.14.8`, `app/build.gradle:8-39` `compileSdk 33 / buildTools 33.0.0 / min 26 / target 33 / Java 1.8`, repos `jcenter()+google()`, `google-services 4.3.15`, `firebase-bom 31.3.0`. Build is green; change is build-files only.

## Goals / Non-Goals

**Goals:**
- Target latest-stable build chain Android Studio expects: Gradle 8.14.x + AGP 8.13.x + SDK 35 + JDK 17 language level.
- Make code latest for `target 35` edge-to-edge (WindowInsets for bottom nav + toolbar/drawer) plus deprecation sweep.

**Non-Goals:**
- No `ExoPlayer → Media3`, no Kotlin/version-catalog migration, no `minSdk` bump, no feature work beyond insets + deprecations.

## Decisions

- **SDK 35, not 34:** Play requires `target 35` (Aug 2025+); `compileSdk 35` matches. Alternative 34 defers the inevitable.
- **Java 17 compat, code stays 8-compatible:** AGP 8 needs JDK 17 to run; set `source/target 17` at build level, no language-feature rewrite.
- **Remove `jcenter()`, keep `google()+mavenCentral()`:** `jcenter` is sunset; all deps resolve via Central/Google.
- **Bump `google-services 4.4.2` + `firebase-bom 33.x`:** matches AGP 8.13/Gradle 8.14 matrix; alternative of pinning old versions risks resolution failures on SDK 35.
- **Defer Media3:** ExoPlayer 2.18.2 still resolves; Media3 is package-rename + player-API break, separate change.
- **Edge-to-edge handling:** `WindowCompat.setDecorFitsSystemWindows(window,false)` in `MainActivity` + `ViewCompat.setOnApplyWindowInsetsListener` on `activity_main` content + `fragment_home` toolbar to apply `statusBars` top + `navigationBars` bottom insets. Alternative opt-out `windowOptOutEdgeToEdgeEnforcement` rejected — removed in stable 35.
- **Deprecation sweep:** `setOnNavigationItemSelectedListener → setOnItemSelectedListener` in `MainActivity:64`, plus `fitsSystemWindows` cleanup. Minimal, mechanical.

## Risks / Trade-offs

- [Risk] `target 35` edge-to-edge + foreground-service/photo-permission tightening → Mitigation: insets fix in this change + smoke-test feed/maps/camera/post flow on Android 15; rollback = revert added inset code.
- [Risk] JDK mismatch (Studio runs JDK 17/21, CLI runs 8) → Mitigation: set `org.gradle.java.home` to Studio JDK 17, verify `java -version` in build log.
- [Risk] Firebase/Places transitive bumps → Mitigation: `assembleDebug` + `lint` gate; rollback = revert 4 build files.

## Migration Plan

1. Edit 4 build files + `MainActivity.java`/`activity_main.xml`/`fragment_home.xml` insets + deprecated listener, sync, `assembleDebug`, `lintDebug`.
2. Install/run debug APK on Android 14 + 15, verify bottom nav not behind gesture bar and drawer toggle below status bar.
3. Rollback: `git checkout -- extrovent_app/build.gradle extrovent_app/app/build.gradle extrovent_app/gradle.properties extrovent_app/gradle/wrapper/gradle-wrapper.properties extrovent_app/app/src/main/java/com/ums/outdoorbuddy/MainActivity.java extrovent_app/app/src/main/res/layout/activity_main.xml extrovent_app/app/src/main/res/layout/fragment_home.xml`.
