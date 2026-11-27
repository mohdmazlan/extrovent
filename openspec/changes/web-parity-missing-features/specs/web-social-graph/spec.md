# Spec Delta

## Purpose

Delivers the social graph on web — user profile pages, finding friends, friend requests, contacts, and event invites — matching the Android social flows.

## ADDED Requirements

### Requirement: View user profile
The system SHALL display any user's profile at `/users/:userId` with avatar, nickname, handle `@{user_id}`, bio fields if available, `total_posts` and `total_friends` counters, posts link, contact link, and friend action button.

#### Scenario: View other user profile
- **WHEN** user navigates to `/users/alice`
- **THEN** system fetches `GET /user/view?user_id=alice` and renders header, counters, and action bar

#### Scenario: Own profile redirects
- **WHEN** user views their own profile via `/users/me` equivalent
- **THEN** system shows self view without Add Friend but with Edit

### Requirement: Friend action states
The system SHALL reflect friend status as `none` (show `Add Friend`), `pending_outgoing` (show `Cancel`), `pending_incoming` (show `Accept/Decline`), `friends` (hide add, show `Message`), mirroring `ViewProfileActivity` logic.

#### Scenario: Send friend request
- **WHEN** status is none and user clicks `Add Friend`
- **THEN** system calls `POST /friend/request {action:add}` and shows pending state

#### Scenario: Accept incoming request
- **WHEN** incoming pending and user clicks `Accept`
- **THEN** system calls `POST /friend/request {action:accept}` and shows Friends state

#### Scenario: Cancel outgoing request
- **WHEN** outgoing pending and user clicks `Cancel`
- **THEN** system calls `POST /friend/request {action:remove}` and returns to none state

### Requirement: Find friends and contacts
The system SHALL provide `/friends/find` (discover all users via `GET /users/list` or `GET /friend/find`) and `/friends` (contacts via `GET /friend/list`), each with search filter and card rows linking to profiles.

#### Scenario: Search users
- **WHEN** user types in Find Friends search
- **THEN** list filters client-side or via query param

#### Scenario: Empty contacts
- **WHEN** contact list is empty
- **THEN** system shows `EmptyState` with Find Friends CTA

### Requirement: Event invites
The system SHALL allow inviting friends to an event at `/events/:id/invite` via list of contacts with `Invite` action calling `POST /event/invite {event_id, user_id}`.

#### Scenario: Invite friend to event
- **WHEN** user clicks `Invite` next to a friend on the invite page
- **THEN** system calls `POST /event/invite` and shows `Invited` confirmation

#### Scenario: Invite page requires event id
- **WHEN** event does not exist
- **THEN** system shows not-found state and blocks invites

### Requirement: Search user click-through
The system SHALL route user results from `SearchPage` to `/users/:userId` instead of dead links.

#### Scenario: Search user navigates to profile
- **WHEN** user clicks a user row in `SearchPage` Users group
- **THEN** system navigates to `/users/:userId`
