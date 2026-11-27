# Spec Delta

## Purpose

Provides a stable UUID identity for users where the login handle `username` is mutable, profile fields are consolidated in `users`, and credentials are isolated to `user_credentials` — so renaming a user never cascades to FK tables.

## ADDED Requirements

### Requirement: Stable UUID primary key not AI
The system SHALL use `users.id CHAR(36)` UUID as the PRIMARY KEY, generated server-side on signup. `users.id` SHALL never be auto-increment and SHALL never change after creation. `username` SHALL NOT be the PK.

#### Scenario: New user gets UUID
- **WHEN** a new user signs up with `username` and `email`
- **THEN** the system creates `users.id` as a UUID string and uses it as the stable identifier for all FKs

#### Scenario: Username change does not change PK
- **WHEN** a user changes `username` from `alice` to `alice2`
- **THEN** `users.id` stays the same and `posts`/`friends`/`place` rows still point to the same `id`

### Requirement: Username and email live in users for display and login lookup
The system SHALL store `users.username VARCHAR(100) UNIQUE` (mutable login handle) and `users.email VARCHAR(255) UNIQUE` in `users`. Login lookup SHALL be `WHERE username = ? OR email = ?` against `users` without joining `user_credentials`. Display of `username`/`email` SHALL require no join.

#### Scenario: Login by username
- **WHEN** client posts `identifier=alice` and `password` to `/auth/login`
- **THEN** the system finds `users` by `username = alice` and verifies `user_credentials.password_hash`

#### Scenario: Login by email
- **WHEN** client posts `identifier=alice@example.com`
- **THEN** the system finds `users` by `email = alice@example.com` as an alias

#### Scenario: Username change
- **WHEN** an authenticated user changes `username` to a free value
- **THEN** future logins use the new `username` and old `username` becomes available

### Requirement: Credentials isolated to password only
The system SHALL store only `user_credentials (user_id FK -> users.id, password_hash VARCHAR(255), created_at, updated_at)` for secrets. `users` SHALL NOT contain `password` or `password_hash`. `user_credentials` SHALL NOT duplicate `username` or `email`. `updated_at` SHALL be the last password change timestamp; no separate `password_changed_at` column SHALL exist. For now the system SHALL NOT maintain a `password_history` table (Option A).

#### Scenario: Password verification via credentials
- **WHEN** login finds `users.id` by `username`/`email`
- **THEN** the system fetches `password_hash` from `user_credentials` by `user_id = users.id` and verifies with `password_verify`

#### Scenario: Password never returned in profile
- **WHEN** `GET /user/profile` is called
- **THEN** the response never contains `password` or `password_hash`

#### Scenario: Last change is updated_at
- **WHEN** `user_credentials` is queried for a user
- **THEN** `updated_at` reflects the last password change time

### Requirement: user_details merged and dropped, department_id removed
The system SHALL have no `user_details` table. `first_name`, `last_name`, `no_phone` SHALL be columns of `users`. `department_id`, `no_ic`, `no_matrik` SHALL not exist. `GET /user/profile` SHALL return those fields from `users` directly.

#### Scenario: Profile read after merge
- **WHEN** `GET /user/profile` is called for a user with `first_name=Ana`
- **THEN** the response contains `first_name`, `last_name`, `no_phone` from `users`

#### Scenario: Profile update writes to users
- **WHEN** `PUT /user/update` sends `first_name` and `no_phone`
- **THEN** the system updates `users.first_name`/`no_phone` for that `id` and does not touch any `user_details` table

#### Scenario: Legacy columns gone
- **WHEN** querying `information_schema.COLUMNS` for `user_details`
- **THEN** the table does not exist and `users` has no `department_id` column

### Requirement: All FKs point to stable UUID id
The system SHALL store FKs as `CHAR(36)` UUID referencing `users.id` in: `posts.user_id`, `place.user_id`, `events.user_id`, `activity.user_id`, `friends.user_id1/2`, `chat_message.user_id`, `chatroom_members.user_id`, `business_profile.user_id`, `post_like`, `post_comment`, `place_*`, `event_*`, `activity_*`. No FK SHALL reference `username`.

#### Scenario: Post created with UUID FK
- **WHEN** authenticated user with `id = uuid-123` creates a post
- **THEN** `posts.user_id = uuid-123` is stored

#### Scenario: Friends still stable after rename
- **WHEN** a user changes `username`
- **THEN** existing `friends` rows still reference the same `users.id` UUID and friendship is intact
