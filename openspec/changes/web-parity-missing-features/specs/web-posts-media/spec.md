# Spec Delta

## Purpose

Completes posts on web with creation, multi-image/video upload, gallery management, and dedicated viewers to match the Android post flows.

## ADDED Requirements

### Requirement: Create post page
The system SHALL provide `/feed/new` (also `/posts/new`) with caption textarea, multi-image picker with preview carousel, optional `place_id|activity_id|event_id` context pill, and submit that creates the post then uploads media.

#### Scenario: Create text-only post
- **WHEN** user submits caption with no images
- **THEN** system calls `POST /post/create {caption, place_id, activity_id, event_id}` and navigates to `/feed`

#### Scenario: Create post with images
- **WHEN** user picks 3 images and submits
- **THEN** system creates post then uploads via `POST /post/upload {post_id} FormData` sequentially and shows progress

#### Scenario: Validation blocks empty submit
- **WHEN** caption and images are both empty
- **THEN** system shows validation error and does not call the API

### Requirement: Feed supports multiple post types
The system SHALL render feed posts for types `image`, `video`, and `multiple` images (carousel), preserving existing like and comment behavior from `FeedPage`.

#### Scenario: Video post playback
- **WHEN** post type is `video`
- **THEN** card shows inline `VideoPlayer` with controls

#### Scenario: Multiple images carousel
- **WHEN** post has `images.length > 1`
- **THEN** card shows swipeable carousel with indicator dots

### Requirement: Image viewer and video player
The system SHALL provide an image viewer (`/media/image/:url` or modal) with pinch/zoom and a video player component with fullscreen toggle mirroring `ImageViewerActivity` and `VideoPlayerActivity`.

#### Scenario: Open image viewer
- **WHEN** user clicks an image in feed or detail carousel
- **THEN** system opens viewer with zoom/pan and close control

#### Scenario: Video fullscreen toggle
- **WHEN** user clicks fullscreen on video
- **THEN** player expands to viewport and restores on exit

### Requirement: Gallery management
The system SHALL allow owners to manage gallery images for a place/activity at `/:type/:id/gallery` with grid, add via multi-pick, and upload via `POST /place|activity/upload` equivalents.

#### Scenario: Add gallery images
- **WHEN** owner picks images on gallery page
- **THEN** system uploads via FormData and refreshes grid

### Requirement: Dedicated comment page
The system SHALL show a dedicated comment page at `/posts/:id/comments` (and `/events/:id/comments`) with comment list and composer, separate from the feed inline drawer.

#### Scenario: Post comments page
- **WHEN** user navigates to `/posts/123/comments`
- **THEN** system fetches `GET /post/comments?post_id=123` and renders composer

#### Scenario: Event comments reuse
- **WHEN** user navigates to `/events/123/comments`
- **THEN** system fetches `GET /event/comments?event_id=123`
