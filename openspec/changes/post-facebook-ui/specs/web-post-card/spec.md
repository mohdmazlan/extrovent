# Spec Delta

## Purpose

Provides a facebook-like post card for the feed that is compact, clickable, and shows author, time, content, media, and icon actions with proper formatting.

## ADDED Requirements

### Requirement: Post card shell and header
The system SHALL render each feed item as an `article.post-card` with a left `Avatar 40` (online dot if applicable), header containing `display_name` linked to `/profile/:username`, optional verified badge, `@handle`, separator `·`, and relative time formatted as `0s/s/m/h/d` plus a `⋯ More` button on the right.

#### Scenario: Header renders correctly
- **WHEN** a post by `alice` (display `Alice`) created 5 minutes ago is shown
- **THEN** the header shows avatar, `Alice`, verified if flagged, `@alice · 5m`, and the More button

### Requirement: Whole-card navigation with guards
The system SHALL navigate to `/post/:id` when the card background is clicked, but SHALL NOT navigate when the click originates from an interactive element (`a`, `button`, `video`) or when text is selected, and SHALL support `Ctrl/Cmd+click` to open in new tab and middle-click.

#### Scenario: Card click opens post
- **WHEN** the user clicks the card background with left button and no text selection
- **THEN** navigation goes to `/post/:id`

#### Scenario: Interactive click does not navigate
- **WHEN** the user clicks the Like button inside the card
- **THEN** only the like toggles and no navigation occurs

### Requirement: Content and media grid
The system SHALL render `post.content` as a link to `/post/:id` inside a `p.post-content` and SHALL render `post.media` via a `PostMedia` grid (1→large, 2→split, 3+→mosaic, video → `VideoPlayer`), opening the post on image click.

#### Scenario: Media grid displayed
- **WHEN** a post has 3 images
- **THEN** a mosaic grid is shown

### Requirement: Stats and icon actions
The system SHALL show a stats row (`♥ likes_count`, `💬 comments_count` formatted with `K/M` via `formatCount`) above a divider, and an actions bar with `Like` (heart filled when `is_liked`), `Comment` (via `Comments` component), and `Share` (Web Share API → clipboard → new tab fallback) icon buttons with `aria-label`.

#### Scenario: Like toggles
- **WHEN** the user clicks Like on an unliked post
- **THEN** `POST /post/like` is called and `likes_count` increments and the heart becomes filled

#### Scenario: Share fallback
- **WHEN** the user clicks Share and `navigator.share` is unavailable
- **THEN** the URL is copied to clipboard or opened in a new tab

### Requirement: Composer entry
The system SHALL show a composer pill at the top of the feed (`Avatar 36` + `"What adventures, {name}? — Share a trail"`) that navigates to `/feed/new` on click.

#### Scenario: Composer navigates to create
- **WHEN** the user clicks the composer pill
- **THEN** navigation goes to `/feed/new`
