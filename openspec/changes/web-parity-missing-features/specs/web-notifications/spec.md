# Spec Delta

## Purpose

Provides a notification center on web that surfaces friend requests, invitations, chat messages, and comment alerts with inline actions, mirroring the Android notifications tab.

## ADDED Requirements

### Requirement: Notifications page
The system SHALL render notifications at `/notifications` fetched via `GET /notifications`, grouped render but single list, with pull-to-refresh equivalent (reload button) and loading skeletons.

#### Scenario: Load notifications
- **WHEN** user visits `/notifications`
- **THEN** system fetches and displays notification items sorted by datetime desc

#### Scenario: Empty inbox
- **WHEN** no notifications exist
- **THEN** system shows `EmptyState` with guidance

### Requirement: Five notification types
The system SHALL render types: `friend_request` (type 1), `invitation` (type 2), `chat_message` (type 3), `comment` (type 5), and `custom` (type 4) with correct avatar, description, and date.

#### Scenario: Friend request notification
- **WHEN** notification type is `friend_request`
- **THEN** system shows `Wants to be your friends` with `Accept`/`Decline` buttons

#### Scenario: Comment notification
- **WHEN** type is `comment`
- **THEN** system shows `commented on your post` linking to `/posts/:sid/comments`

### Requirement: Inline friend request actions
The system SHALL allow accepting or declining a friend request directly from the notification row, calling `POST /friend/request {action:accept|remove}` and removing/updating the row optimistically.

#### Scenario: Accept from notification
- **WHEN** user clicks `Accept` on a friend request notification
- **THEN** system calls accept API, shows success, and removes action buttons

#### Scenario: Decline from notification
- **WHEN** user clicks `Decline`
- **THEN** system calls remove API and dismisses the row

### Requirement: Notification navigation
The system SHALL navigate to the source on row click: comment -> post comments, chat_message -> chat room, invitation -> event detail, friend_request -> user profile, custom -> description target.

#### Scenario: Tap comment notification
- **WHEN** user clicks a comment notification
- **THEN** system navigates to `/posts/:sid/comments`

#### Scenario: Tap chat notification
- **WHEN** user clicks a chat_message notification
- **THEN** system navigates to `/chat/:roomId`

### Requirement: Badge count and polling
The system SHALL display an unread count badge on the `Notifications` nav item in `AppShell` and optionally poll for new notifications.

#### Scenario: Badge appears
- **WHEN** notifications include unread items
- **THEN** nav shows a numeric badge with count
