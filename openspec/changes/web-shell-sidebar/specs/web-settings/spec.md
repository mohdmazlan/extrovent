# Spec Delta

## Purpose

Provides a Settings page on web for user preferences such as theme, mirroring the app's SettingActivity, so light/dark mode can be changed without relying on OS preference alone.

## ADDED Requirements

### Requirement: Settings page route and navigation
The system SHALL expose `/settings` reachable from the You group (sidebar) and the mobile More sheet, as well as from the profile area.

#### Scenario: Navigate to settings from sidebar
- **WHEN** the user clicks Settings under You in the sidebar
- **THEN** navigation goes to `/settings`

#### Scenario: Direct access to settings
- **WHEN** the user navigates to `/settings`
- **THEN** the settings page loads without authentication error (when authenticated) or redirects to login when unauthenticated

### Requirement: Theme control on settings page
The system SHALL render a segmented control with options Light, Dark, and System on `/settings` that reflects the current persisted choice and updates it on selection.

#### Scenario: Control reflects stored preference
- **WHEN** `localStorage` `extrovent_theme` is `dark`
- **THEN** the Dark segment appears selected on load

#### Scenario: Changing theme updates storage
- **WHEN** the user selects Light
- **THEN** `localStorage` `extrovent_theme` becomes `light` and the UI updates immediately

### Requirement: Theme persistence and application
The system SHALL persist the chosen mode in `localStorage` and apply it via `data-theme` on `<html>` on load, so reloads keep the choice and System follows `prefers-color-scheme`.

#### Scenario: Persistence across reload
- **WHEN** the user reloads after choosing Dark
- **THEN** the theme remains dark without flicker
