# Spec Delta

## Purpose

Adds chat to web — room list with public Global room and private rooms, plus realtime messaging and typing indicators to reach parity with the Android chat.

## ADDED Requirements

### Requirement: Chat room list
The system SHALL list chat rooms at `/chat` showing Global/Public room `room_id=0` pinned top, then private rooms fetched via `GET /chat/rooms`, each with avatar, name, last message, and timestamp.

#### Scenario: Show chat list
- **WHEN** user navigates to `/chat`
- **THEN** system renders Global Chat plus private rooms with last-message preview

#### Scenario: Empty private rooms
- **WHEN** user has no private chats
- **THEN** Global Chat still appears with empty-list hint

### Requirement: Chat room view
The system SHALL show messages at `/chat/:roomId` with header, message bubbles (sent/received), timestamp via `TimeStr`, scroll-to-latest, input field, send button, and progress indicator.

#### Scenario: Load messages
- **WHEN** user opens `/chat/abc`
- **THEN** system fetches `GET /chat/messages?room_id=abc` and renders bubbles

#### Scenario: Send message optimistic
- **WHEN** user sends `hello`
- **THEN** system appends bubble optimistically, calls `POST /chat/message {room_id, message}`, and reconciles on success

### Requirement: Realtime messages via socket
The system SHALL receive new messages in realtime via `Socket.IO` or `WebSocket` at `VITE_SOCKET_URL` (fallback to short polling if unavailable), appending messages without reload.

#### Scenario: Receive realtime message
- **WHEN** socket delivers `{type:"message", room_id, user_id, message}`
- **THEN** room list and open room append the message

#### Scenario: Fallback polling
- **WHEN** socket URL is not configured or connection fails
- **THEN** system polls `GET /chat/messages` at interval and still delivers messages

### Requirement: Typing indicators
The system SHALL show `typing...` in the header when the peer types, sending `start_typing` on keystroke and `stop_typing` after 1s idle or send.

#### Scenario: Peer typing visible
- **WHEN** socket delivers `{type:"typing", room_id, user_id}`
- **THEN** header shows `typing...` until `stop_typing` or timeout

#### Scenario: Self typing sends events
- **WHEN** user types in the input
- **THEN** system emits `start_typing` and after 1s without input emits `stop_typing`

### Requirement: Global chat room behavior
The system SHALL treat `room_id=0` as the public room with title `Public Chat` available to all authenticated users.

#### Scenario: Open global chat
- **WHEN** user clicks Global Chat
- **THEN** system navigates to `/chat/0` titled Public Chat
