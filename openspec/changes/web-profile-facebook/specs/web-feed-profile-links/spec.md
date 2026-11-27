# Spec Delta

## Purpose

Makes every feed avatar and author name a navigational link to that user's profile, so a feed view is also a directory of people.

## ADDED Requirements

### Requirement: Feed avatars and names link to profiles
The system SHALL wrap feed `PostCard` avatar and author name in `Link`s to `/users/:userId` (or `/profile` when `user_id` equals the viewer) and SHALL do the same for comments author and notification actors where applicable.

#### Scenario: Click feed avatar goes to profile
- **WHEN** a user clicks the avatar on a feed card by `bob`
- **THEN** navigation goes to `/users/bob` (or `/profile` if bob is the viewer)

#### Scenario: Click feed author name goes to profile
- **WHEN** a user clicks the author name `Alice` on a feed card
- **THEN** navigation goes to `/users/alice`

#### Scenario: Comments author links to profile
- **WHEN** a user clicks a comment author `carol`
- **THEN** navigation goes to `/users/carol`

### Requirement: Foreign profile via feed can Add Friend
The system SHALL ensure the profile reached from feed shows the same `FriendButton` 4-state behaviour as direct navigation, so Add Friend is reachable in one click from feed.

#### Scenario: Feed to add friend
- **WHEN** a user clicks `Bob` from feed, lands on `/users/bob` in state `none`
- **THEN** the profile shows `Add Friend` that creates a friend request on click
