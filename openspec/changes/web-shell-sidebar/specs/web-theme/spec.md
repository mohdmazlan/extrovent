# Spec Delta

## Purpose

Brings the web's visual theme to parity with the OutdoorBuddy Android app's slate-blue palette, so headers, accents, and backgrounds match colorPrimary, colorPrimaryDark, colorAccent and background.

## ADDED Requirements

### Requirement: Accent color parity with colorPrimary
The system SHALL use `#737BAE` (app `colorPrimary`) as the web accent for primary affordances.

#### Scenario: Primary button uses app blue
- **WHEN** the user views a primary button
- **THEN** its background is `#737BAE`

#### Scenario: Active nav uses app blue
- **WHEN** a sidebar or bottom-nav item is active
- **THEN** its indicator or text uses `#737BAE`

### Requirement: Dark accent parity with colorPrimaryDark
The system SHALL use `#2C4E64` as the accent-hover/dark variant for hover and header gradients.

#### Scenario: Hover state uses dark blue
- **WHEN** the user hovers a primary button
- **THEN** its background is `#2C4E64`

### Requirement: Soft accent parity with colorAccent
The system SHALL use `#A4CCD1` derived soft and ring tokens for subtle backgrounds and focus rings.

#### Scenario: Soft background visible
- **WHEN** a card uses the soft accent background
- **THEN** it renders with `rgba(164,204,209,0.18)` or equivalent

#### Scenario: Focus ring uses app tint
- **WHEN** a control receives focus
- **THEN** the ring uses `rgba(115,123,174,0.35)` consistent with `#737BAE`

### Requirement: Background parity
The system SHALL use `#f7f7f7` (app `background`) as the page background and `#FFFFFF` as the elevated surface, so cards pop on a warm grey rather than pure white.

#### Scenario: Page background is app grey
- **WHEN** the user views any page on light theme
- **THEN** the canvas background is `#f7f7f7`

### Requirement: Text color parity
The system SHALL use `#333` for primary text and `#888` for muted text on light theme, matching `etTextColor` and `textGrey`.

#### Scenario: Muted text uses app grey
- **WHEN** secondary text is rendered
- **THEN** its color resolves to `#888`

### Requirement: Gradient and header theming
The system SHALL replace the forest gradient with `linear-gradient(135deg, #2C4E64 0%, #737BAE 60%, #A4CCD1 100%)` for hero/logo, and apply `#737BAE` to sidebar active states and bottom-bar selected tint matching `@drawable/bottom_navigation_item_color`.

#### Scenario: Logo gradient shows slate-blue
- **WHEN** the app header logo is rendered
- **THEN** its background gradient includes `#737BAE` and `#2C4E64`

#### Scenario: Bottom bar selected tint matches app
- **WHEN** a bottom-nav item is selected on mobile
- **THEN** its icon color is `#737BAE` (or currentColor with tint), matching the app's selected state

### Requirement: Dark theme adaptation
The system SHALL preserve contrast in dark mode by using a 12% soft tint of `#737BAE` on dark surfaces and keeping the same hue family, rather than switching to the current forest green.

#### Scenario: Dark mode retains slate-blue
- **WHEN** the user prefers dark color scheme
- **THEN** accent-soft resolves to `rgba(115,123,174,0.12)` or equivalent, not green

### Requirement: User-controlled theme toggle in Settings
The system SHALL provide a Settings page at `/settings` with a light/dark/system segmented control that sets `data-theme="light|dark"` on `<html>` and persists the choice in `localStorage` `extrovent_theme`; System SHALL follow `prefers-color-scheme`, while explicit Light or Dark SHALL override it. The choice SHALL survive reloads.

#### Scenario: User selects dark mode in settings
- **WHEN** the user chooses Dark on `/settings`
- **THEN** `data-theme="dark"` is set on `<html>` and persists after reload

#### Scenario: User selects system mode
- **WHEN** the user chooses System on `/settings`
- **THEN** no `data-theme` override is set and the theme follows the OS preference

#### Scenario: Settings accessible from shell
- **WHEN** the user opens Settings via the You group in the sidebar or the More sheet on mobile
- **THEN** navigation goes to `/settings`
