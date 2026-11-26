# Spec Delta: Web UI

## Purpose

Provides a stunning, cohesive visual design system for the Extrovent web app using SCSS — delivering a premium outdoor/adventure identity, responsive layout, and polished component-driven experience across all MVP pages.

## ADDED Requirements

### Requirement: SCSS Design Foundation
The system SHALL use SCSS as the styling language with a structured architecture for variables, mixins, and theming that compiles via Vite with zero runtime cost.

#### Scenario: SCSS compiles successfully
- **WHEN** a developer runs `npm run dev` or `npm run build`
- **THEN** all SCSS files compile without errors and styles apply correctly in the browser

#### Scenario: No plain CSS regressions
- **WHEN** the design system is in place
- **THEN** no page relies on duplicated inline `style={{}}` for layout or visual design

### Requirement: Design Tokens
The system SHALL expose a consistent set of design tokens for colors (outdoor/earth palette with accent), spacing scale, typography, radii, shadows, and motion durations.

#### Scenario: Tokens drive visual consistency
- **WHEN** a component uses a color, spacing, or radius value
- **THEN** it references a token rather than a hardcoded value, ensuring visual consistency across pages

### Requirement: App Shell and Navigation
The app SHALL provide a shared App Shell with a sticky header, responsive navigation, and a centered content container that wraps all authenticated pages.

#### Scenario: Navigation is consistent across pages
- **WHEN** a user navigates between Home, Feed, Events, Places, Profile, and Search
- **THEN** the header and navigation remain visually consistent and indicate the active route

#### Scenario: Responsive layout adapts
- **WHEN** the viewport narrows to mobile width
- **THEN** navigation collapses to a mobile-friendly pattern and content reflows without horizontal scroll

### Requirement: Reusable Component Library
The system SHALL provide styled reusable components for Button, Card, Input, Badge, Skeleton loader, and EmptyState via SCSS modules.

#### Scenario: Components render consistently
- **WHEN** any page uses a Button or Card
- **THEN** it displays with the correct variant, hover/focus states, and spacing without extra inline styling

#### Scenario: Loading and empty states are styled
- **WHEN** data is loading or an empty list is returned
- **THEN** the user sees a skeleton or styled empty state instead of bare text

### Requirement: Polished MVP Pages
All MVP pages (Home, Feed, Events, Places, Profile, Search, Login/Register) SHALL be visually polished with card grids, proper typography, spacing, hover interactions, and responsive breakpoints.

#### Scenario: Feed looks stunning
- **WHEN** a user views the Feed page with posts
- **THEN** posts appear as styled cards in a responsive grid with hover lift and proper typography

#### Scenario: Places map is integrated
- **WHEN** a user views the Places page
- **THEN** the Leaflet map is wrapped in a styled container with a cohesive border, shadow, and legend that matches the design system

### Requirement: Motion and Delight
The system SHALL include subtle motion for page transitions, card hover lifts, and button interactions that feel premium without being distracting.

#### Scenario: Hover provides feedback
- **WHEN** a user hovers over a card or button
- **THEN** a subtle lift/shadow or color transition occurs within 200ms

### Requirement: Theming and Dark Mode
The system SHALL support light and dark themes via CSS custom properties generated from SCSS, respecting `prefers-color-scheme` and allowing future manual toggle.

#### Scenario: Dark mode is refined
- **WHEN** the user’s system prefers dark mode
- **THEN** the app renders with appropriate dark palette values without contrast or readability issues

### Requirement: No Functional Regressions
Styling changes SHALL NOT alter API behavior, routing, auth flow, or data handling; all existing functionality MUST remain intact.

#### Scenario: Functionality preserved
- **WHEN** a user logs in, creates an event/place, likes a post, or searches
- **THEN** the underlying behavior is identical to before the UI enhancement
