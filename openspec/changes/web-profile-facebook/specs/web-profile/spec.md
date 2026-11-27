# Spec Delta

## Purpose

Provides a facebook-like profile entry via a header avatar dropdown and makes `/profile` the authenticated user's profile view with feed, while `/profile/edit` hosts the edit form and `/users/:id` shows any user's profile with Add Friend.

## ADDED Requirements

### Requirement: Header avatar dropdown menu
The system SHALL turn the header name+avatar into a dropdown trigger that opens a menu with `View profile → /profile`, `Settings → /settings`, and `Logout`, dismissing on outside click, `Esc`, or backdrop, with proper `aria-haspopup/menu` and focus management.

#### Scenario: Open menu via avatar
- **WHEN** the user clicks the header avatar/name
- **THEN** the menu appears with the three items

#### Scenario: Menu navigation to profile
- **WHEN** the user clicks `View profile` in the menu
- **THEN** navigation goes to `/profile` and the menu closes

#### Scenario: Dismiss menu
- **WHEN** the user presses `Esc` or clicks outside the menu
- **THEN** the menu closes and focus returns to the trigger

### Requirement: Profile view at /profile for self
The system SHALL render `/profile` as the authenticated user's profile view (reusing `ViewProfilePage` in self mode): banner blur, avatar 100, nickname `@{user_id}`, `total_posts`/`total_friends`, `Edit profile → /profile/edit`, and a paginated posts feed via `listUserPosts`.

#### Scenario: Own profile shows edit entry
- **WHEN** an authenticated user visits `/profile`
- **THEN** the header shows `Edit profile` linking to `/profile/edit` and not `Add Friend`

#### Scenario: Profile shows own feed
- **WHEN** `/profile` loads and the user has posts
- **THEN** the posts feed appears below the header with pagination

### Requirement: Profile edit moved to /profile/edit
The system SHALL host the editable profile form (5 fields `nickname/email/first_name/last_name/no_phone` + avatar) at `/profile/edit` and SHALL keep saving via `updateProfile` / `getProfile`.

#### Scenario: Edit saves and reflects
- **WHEN** the user edits fields on `/profile/edit` and saves
- **THEN** the data persists and the view at `/profile` reflects the change

#### Scenario: Foreign profile hides edit
- **WHEN** visiting `/users/:id` where `:id` is not the viewer
- **THEN** `Edit profile` is not shown

### Requirement: Foreign profile with Add Friend
The system SHALL render `/users/:id` with the same header as self but with a 4-state `FriendButton` (`none/pending_outgoing/pending_incoming/friends → Add/Cancel/Accept+Decline/Message → /chat/:roomId`) when viewer is not self.

#### Scenario: Add friend from profile
- **WHEN** a logged-in user views another user's profile in state `none` and clicks `Add Friend`
- **THEN** a `POST /friend/request` is made and the button becomes `Cancel`

### Requirement: Profile posts adapter
The system SHALL provide `listUserPosts(userId, page)` that tries `GET /post/my?user_id=&page=` or `GET /post/list?user_id=&page=` and falls back to client-filtered `GET /post/list?page=` when the backend does not support the param, and SHALL paginate.

#### Scenario: Paginated user posts
- **WHEN** the user scrolls the profile feed
- **THEN** the next page is appended

#### Scenario: Empty user feed
- **WHEN** the user has no posts
- **THEN** an empty state is shown

### Requirement: Sidebar Profile still reaches view
The system SHALL keep `Sidebar` `Profile → /profile` pointing to the view (not edit), so header menu and sidebar agree.

#### Scenario: Sidebar profile navigation
- **WHEN** the user clicks `Profile` in the sidebar
- **THEN** navigation goes to `/profile` (self view)
