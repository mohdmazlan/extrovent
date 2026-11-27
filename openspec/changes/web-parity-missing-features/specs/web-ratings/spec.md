# Spec Delta

## Purpose

Adds ratings for places, activities, and events on web — average display, rating lists, and submission via dialog — reaching parity with the Android rating flows.

## ADDED Requirements

### Requirement: Display ratings summary
The system SHALL display average rating and count on place/activity/event detail pages, using star `RatingBar` equivalent and text count.

#### Scenario: Detail shows average
- **WHEN** place has avg 4.2 with count 12
- **THEN** detail renders stars filled to 4.2 and text `12 reviews`

#### Scenario: No ratings
- **WHEN** item has zero ratings
- **THEN** system shows `No ratings yet` with rate CTA

### Requirement: Rating list
The system SHALL fetch and render rating reviews list via `GET /place/ratings?place_id=`, `GET /activity/ratings?activity_id=`, `GET /event/ratings?event_id=` showing avatar, nickname, stars, comment, and date.

#### Scenario: Load rating reviews
- **WHEN** user scrolls detail ratings section
- **THEN** system loads and renders review rows

### Requirement: Rate dialog
The system SHALL allow authenticated users to submit or update their rating via `RatingDialog` (stars + optional comment) calling `POST /place/rate`, `POST /activity/rate`, or `POST /event/rate` and optimistically updating average and list.

#### Scenario: Submit new rating
- **WHEN** user picks 5 stars and confirms
- **THEN** system posts rating, shows success, and updates average/count

#### Scenario: Update existing rating
- **WHEN** user already rated and changes stars
- **THEN** system posts update and reflects new value without duplicate entry

### Requirement: Rating permission
The system SHALL allow only one rating per user per item; the dialog pre-fills existing rating when loaded via `GET /rating/my?target_id=` or inferred from list.

#### Scenario: Pre-filled rating
- **WHEN** user opens rate dialog and has prior rating
- **THEN** stars show prior value

### Requirement: Rating validation
The system SHALL require 1-5 stars; submission with 0 stars is blocked with inline error.

#### Scenario: Invalid rating blocked
- **WHEN** user tries to submit with 0 stars
- **THEN** dialog shows error and does not call the API
