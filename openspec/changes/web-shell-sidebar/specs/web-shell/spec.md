# Spec Delta

## Purpose

Provides a responsive app-like shell for the web — persistent sidebar on desktop and unlabeled bottom navigation on mobile — matching the Android app's bottom bar and handling all navigation that currently lives in the top header.

## ADDED Requirements

### Requirement: Desktop sidebar navigation
The system SHALL render a persistent left sidebar on viewports wider than 1024px with branding, grouped navigation sections, and no top-bar nav pills.

#### Scenario: Sidebar visible on desktop
- **WHEN** viewport is 1280px wide and the user is authenticated
- **THEN** a 240px left rail shows Discover, Social, and You groups alongside the 4 primary items

#### Scenario: Content respects sidebar
- **WHEN** the sidebar is visible
- **THEN** the main content area is offset by 240px and retains the 1120px max container

### Requirement: Four primary items mirror BottomNavigationView
The system SHALL map the app's four bottom items (`Home` `ic_home_ol`, `Post` `ic_group_ol`, `Notification` `ic_bell_ol`, `Profile` `ic_app_ol`) to web routes Explore (`/` and `/explore`), Feed (`/feed`), Notifications (`/notifications`), and Profile (`/profile`).

#### Scenario: Primary item navigates correctly
- **WHEN** the user clicks the Feed item in the sidebar or bottom bar
- **THEN** navigation goes to `/feed` and that item shows the active indicator

### Requirement: Grouped secondary navigation
The system SHALL group secondary routes under Discover (Places `/places`, Events `/events`, Activities `/activities`, Search `/search`), Social (Chat `/chat`, Friends `/friends/find` and `/friends`), and You (Business `/business`, Settings `/settings`).

#### Scenario: Secondary item expands
- **WHEN** the user clicks Discover on desktop
- **THEN** Places, Events, and Activities are revealed under that group without a page reload

### Requirement: Mobile bottom navigation unlabeled with More sheet
The system SHALL show a fixed 56px bottom bar on viewports at or below 1024px with exactly 4 unlabeled icon items matching `labelVisibilityMode="unlabeled"` and tint `@drawable/bottom_navigation_item_color`, plus a More affordance that opens a sheet/drawer for secondary routes.

#### Scenario: Bottom bar on mobile
- **WHEN** viewport is 390px wide
- **THEN** the bottom bar shows four icon-only items with active tint equal to the app's selected color

#### Scenario: More sheet on mobile
- **WHEN** the user taps More
- **THEN** a sheet reveals Discover, Social, and You items and dismisses on selection or backdrop tap

### Requirement: Active indicator and badge behavior
The system SHALL highlight the active route with a filled indicator analogous to `app:itemActiveIndicatorStyle` and show a numeric badge on Notifications when unread count is greater than zero, updated at least every 15 seconds.

#### Scenario: Active state visible
- **WHEN** the current route is `/notifications`
- **THEN** the Notifications item shows the filled indicator

#### Scenario: Notification badge updates
- **WHEN** unread notifications become 3
- **THEN** the Notifications item shows `3` within 15 seconds without a page reload

### Requirement: Search placement — header icon plus grouped nav
The system SHALL expose Search as a header magnifying-glass icon linking to `/search` on all viewports and also as an item under Discover in the sidebar and inside the mobile More sheet; Search SHALL NOT appear as a primary bottom-bar item to preserve the 4-icon app parity.

#### Scenario: Search via header icon on desktop
- **WHEN** viewport is wide and the user clicks the header search icon
- **THEN** navigation goes to `/search`

#### Scenario: Search in sidebar Discover group
- **WHEN** the user opens the Discover group in the sidebar
- **THEN** Search appears alongside Places, Events, and Activities

#### Scenario: Search in More sheet on mobile
- **WHEN** the user opens the More sheet on mobile
- **THEN** Search appears under Discover

### Requirement: Header and sidebar collapsing
The system SHALL keep the header minimal (brand, search-icon, avatar, logout) and never duplicate sidebar primary links in the header on desktop; on mobile the header shows only brand, search-icon, and avatar while navigation lives in the bottom bar and More sheet.

#### Scenario: No duplicate nav on desktop
- **WHEN** viewport is wide
- **THEN** the header contains no nav pills that also appear in the sidebar

#### Scenario: Header minimal on mobile
- **WHEN** viewport is narrow
- **THEN** the header height is 56px and contains only brand and user affordances
