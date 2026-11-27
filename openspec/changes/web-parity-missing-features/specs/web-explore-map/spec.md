# Spec Delta

## Purpose

Provides a map-based explorer on web that mirrors HomeFragment's mixed-mode discovery — browsing places, events, and activities on one Leaflet map with chips and create flow.

## ADDED Requirements

### Requirement: Explorer route and view modes
The system SHALL provide `/` (authenticated) and `/explore` explorer showing a Leaflet map with three view modes: Places, Events, Activities, selectable via chips/tabs, defaulting to Places.

#### Scenario: Authenticated home shows explorer
- **WHEN** authenticated user visits `/`
- **THEN** system renders the explorer map with mode selector instead of the static hero-only page

#### Scenario: Switch view modes
- **WHEN** user selects `Events`
- **THEN** system loads event markers and shows event chips

### Requirement: Category chip filtering
The system SHALL display mode-specific category chips and filter markers by selected category (Places: Restaurant/Gym/Mall/Hall/Others; Events: Concert/Tournament/Others; Activities: Hangout/Hiking/Rafting/Fishing/Cycling/Camping/Gaming/Racing/Others) with a dismissible active chip.

#### Scenario: Filter by category
- **WHEN** user clicks chip `Hiking` in Activity mode
- **THEN** system reloads markers with `category=Hiking` and shows an active filter chip

#### Scenario: Clear filter
- **WHEN** user dismisses the active chip
- **THEN** system reloads without category filter

### Requirement: Map markers and detail navigation
The system SHALL display markers for all items in the current mode/filter, with clustering, and navigate to the corresponding detail page on click.

#### Scenario: Click marker navigates to detail
- **WHEN** user clicks a place marker
- **THEN** system navigates to `/places/:id`

#### Scenario: Markers cluster at low zoom
- **WHEN** many markers overlap
- **THEN** system clusters them and expands on click/zoom

### Requirement: My-location and map pick to create
The system SHALL provide My-Location button (geolocation) and map click/long-press to stage a new item, opening the create form with `lat/lng` pre-filled.

#### Scenario: Use my location
- **WHEN** user clicks `My location`
- **THEN** system centers map on device coordinates or shows error if permission denied

#### Scenario: Click map to create
- **WHEN** user clicks empty map area
- **THEN** system drops a temporary pin and offers `Add here` linking to `/places/new?lat=&lng=` (or activity/event variant by mode)

### Requirement: Explorer loading and empty states
The system SHALL show skeleton loaders while fetching markers and `EmptyState` when no results match the current mode/filter.

#### Scenario: No results
- **WHEN** filter returns zero items
- **THEN** system shows `EmptyState` with clear-filter action
