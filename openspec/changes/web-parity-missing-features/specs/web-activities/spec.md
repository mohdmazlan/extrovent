# Spec Delta

## Purpose

Brings the Activities domain to web parity with the Android app — list, detail, create, edit/delete, gallery, and category handling for outdoor activities.

## ADDED Requirements

### Requirement: Activity list with filters
The system SHALL provide an activities list page with tabs All/Mine/Joined and category filter, showing card grid with category badge, title, owner, and description.

#### Scenario: Browse all activities
- **WHEN** user navigates to `/activities`
- **THEN** system displays all activities as cards fetched via `GET /activity/list`

#### Scenario: Filter mine or joined
- **WHEN** user selects `Mine` tab
- **THEN** system fetches `GET /activity/my` and displays only owned activities

### Requirement: Activity detail page
The system SHALL display activity detail at `/activities/:id` with title, category, description, owner, coordinate map pin, image carousel, ratings summary, and related posts.

#### Scenario: View activity detail
- **WHEN** user opens `/activities/:id`
- **THEN** system fetches `GET /activity/get?activity_id=` and renders hero, meta, map, and ratings

#### Scenario: Detail shows not-found
- **WHEN** activity id does not exist (404)
- **THEN** system displays `EmptyState` with not-found message

### Requirement: Create activity
The system SHALL allow authenticated users to create an activity via `/activities/new` with required title, category (Hangout/Hiking/Rafting/Fishing/Cycling/Camping/Gaming/Racing/Others), description, coordinate from map pick, optional `business_profile_id` and fee, and multi-image upload.

#### Scenario: Create activity succeeds
- **WHEN** user submits valid form
- **THEN** system calls `POST /activity/create` then uploads images via `FormData` and navigates to `/activities/:id`

#### Scenario: Coordinate pre-filled from map
- **WHEN** user arrives via `/activities/new?lat=..&lng=..` from explorer map long-click
- **THEN** form shows picked coordinate and map marker at that location

#### Scenario: Validation blocks submit
- **WHEN** required fields are empty or category is invalid
- **THEN** system shows inline `Input` errors and does not call the API

### Requirement: Edit and delete activity
The system SHALL allow the activity owner to edit fields and delete the activity with confirmation.

#### Scenario: Owner edits activity
- **WHEN** owner opens edit at `/activities/:id/edit` and saves
- **THEN** system calls `PUT /activity/update` and refreshes detail

#### Scenario: Owner deletes activity
- **WHEN** owner confirms delete on detail page
- **THEN** system calls `DELETE /activity/delete` and navigates to `/activities`

#### Scenario: Non-owner cannot see edit controls
- **WHEN** viewer is not the owner or business owner
- **THEN** system hides edit and delete actions

### Requirement: Activity gallery and category icons
The system SHALL display activity images in a carousel and map pins use category-specific icons mirroring `ListPlace.getIcon()` in the app.

#### Scenario: Multiple images carousel
- **WHEN** activity has multiple images
- **THEN** detail shows `ViewPager`-style carousel with navigation

#### Scenario: Category icon on map
- **WHEN** activity with category `Hiking` appears on the explorer map
- **THEN** its marker uses the hiking icon variant
