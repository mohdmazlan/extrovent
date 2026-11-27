# Spec Delta

## Purpose

Manages business profiles on web — listing, registration, verified status, and editing — so business users can own places and events as in the Android app.

## ADDED Requirements

### Requirement: List business profiles
The system SHALL list the current user's business profiles at `/business` with company name, registration number, description, creation date, and approved status.

#### Scenario: List own profiles
- **WHEN** user navigates to `/business`
- **THEN** system fetches `GET /business/list` and renders profile cards

#### Scenario: No profiles empty state
- **WHEN** user has no business profiles
- **THEN** system shows `EmptyState` with `Create Business Profile` CTA

### Requirement: Register business profile
The system SHALL allow creating a business profile at `/business/new` with company name and registration number required.

#### Scenario: Successful registration
- **WHEN** user submits valid company name and registration number
- **THEN** system calls `POST /business/create`, persists `profile_id`, and navigates to `/business/:id`

#### Scenario: Validation errors
- **WHEN** required fields are missing
- **THEN** system shows inline errors and does not call the API

### Requirement: View business profile with status
The system SHALL display a business profile at `/business/:id` with header, verified/pending badge, owner info, and gated links to its places.

#### Scenario: Approved profile shows places link
- **WHEN** profile is approved
- **THEN** the page shows `View Places` linking to filtered places

#### Scenario: Pending profile gates places
- **WHEN** profile is not approved
- **THEN** the places link is disabled with pending message

### Requirement: Edit business profile
The system SHALL allow the owner to edit company name, registration number, description via inline edit and avatar via image upload resized to 500x500 at `/business/:id/edit`.

#### Scenario: Edit details succeeds
- **WHEN** owner updates fields and saves
- **THEN** system calls `PUT /business/update` and shows `Saved` confirmation

#### Scenario: Non-owner cannot edit
- **WHEN** viewer is not the business owner
- **THEN** edit actions are hidden

### Requirement: Business profile used in place/event creation
The system SHALL offer an optional `business_profile_id` selector in place/activity/event create forms, populated from the user's business profiles.

#### Scenario: Select business profile on create
- **WHEN** creating a place and user has business profiles
- **THEN** the form shows a dropdown of owned profiles bound to `business_profile_id`
