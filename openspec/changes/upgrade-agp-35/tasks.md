# Tasks

## 1. Build files upgrade

- [x] 1.1 Update root `extrovent_app/build.gradle` repos to `google()+mavenCentral()` and `google-services 4.3.15 → 4.4.2` and verify file contains no `jcenter()` by reading it
- [x] 1.2 Update `extrovent_app/app/build.gradle` to `compileSdk 35`, `buildTools 35.0.0`, `targetSdk 35`, `Java 17`, `firebase-bom 33.x` and verify by reading the file
- [x] 1.3 Confirm `gradle-wrapper.properties` stays `gradle-8.14.8` and `gradle.properties` sets AndroidX/JDK17 flags and verify by reading both files

## 1b. Latest code for target 35

- [x] 1.4 Apply edge-to-edge insets in `MainActivity.java` (`WindowCompat.setDecorFitsSystemWindows` + `ViewCompat.setOnApplyWindowInsetsListener`) and `activity_main.xml` + `fragment_home.xml` and verify bottom nav not behind gesture bar and drawer toggle below status bar by reading the three files
- [x] 1.5 Replace deprecated `setOnNavigationItemSelectedListener` with `setOnItemSelectedListener` in `MainActivity.java:64` and verify build has no deprecation warning for it

## 2. Verify

- [x] 2.1 Run `:app:assembleDebug` in `extrovent_app` on JDK 17 and verify `BUILD SUCCESSFUL`
- [ ] 2.2 Smoke-test debug APK on Android 14 + 15 (feed scroll, post, maps, camera) and verify no `target 35` behavior crash

## Workflow follow-up

- Run `/opsx-apply` to implement tasks 1.1-2.2 from this change.
- Archive `upgrade-agp-35` after review.
