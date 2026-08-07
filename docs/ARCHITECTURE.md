# DisasterReady Architecture

## Phase 1 architecture

Phase 1 is frontend-only and local-data-only.

```text
Expo application
  -> typed mock repositories
  -> domain models
  -> feature components
  -> screens
```

This lets the team validate navigation, usability, accessibility, and the action flow before introducing network uncertainty.

## Target architecture

```text
Mobile app
  -> local storage/cache
  -> application services
  -> external API adapters
      -> National Weather Service alerts
      -> verified shelter source
      -> map deep links
  -> Supabase
      -> optional auth
      -> PostgreSQL
      -> edge functions
      -> scheduled ingestion jobs
      -> push-token management
```

## Mobile layers

### Presentation

- Expo Router screens
- Feature components
- Design-system components
- Accessibility behavior
- Loading, stale, offline, empty, and error states

### Domain

Core models:

- HazardType
- Alert
- AlertSeverity
- AlertStatus
- SavedLocation
- ActionPlanTemplate
- ActionPlan
- ActionStep
- Shelter
- UserPreferences
- DataFreshness

### Application services

Examples:

- AlertService
- ActionPlanService
- ShelterService
- RoutingService
- NotificationService
- PreferencesService

### Infrastructure

Examples:

- NwsAlertAdapter
- ShelterApiAdapter
- LocalAlertRepository
- LocalPreferencesRepository
- SupabaseProfileRepository
- AppleMapsAdapter
- GoogleMapsAdapter

## Alert normalization

Raw provider data must be converted into an internal `Alert` model.

The app should not expose provider-specific response structures to components.

A normalized alert should include:

- Internal ID
- Provider ID
- Hazard type
- Headline
- Plain-language summary
- Severity
- Urgency
- Certainty
- Status
- Geographic description
- Issue time
- Effective time
- Expiration time
- Instruction text
- Original source URL or identifier
- Retrieval time
- Data freshness state
- Demo flag

## Action-plan selection

Action plans are deterministic.

Input:

- Hazard type
- Severity
- Urgency
- Alert status
- Optional structured conditions

Output:

- Reviewed action-plan template
- Ordered steps
- Source references
- Explanation of why the template was selected

A language model may later simplify wording, but it must not add or remove safety actions without a reviewed rule.

## Offline strategy

Cache:

- Preferences
- Saved locations
- Last successful alert results
- Active action plan
- Checklist progress
- Preparedness templates
- Recently retrieved verified shelters
- Last update timestamps

Every cached object needs a retrieval timestamp. The UI must disclose stale data.

## Initial Supabase tables

Introduce only after local flows work:

- profiles
- saved_locations
- user_preferences
- device_tokens
- alerts
- alert_areas
- action_plan_templates
- action_plan_steps
- user_action_plans
- user_action_step_status
- shelters

Row-level security is mandatory for user-specific rows.

## Security boundaries

Client-safe:

- Supabase project URL
- Supabase publishable/anon key when protected by RLS
- Public alert endpoints
- Public shelter endpoints

Server-only:

- Supabase service-role key
- Notification provider credentials
- Administrative ingestion credentials
- Any private third-party key

## Routing

Do not implement turn-by-turn navigation.

The app selects a destination and opens:

- Apple Maps on iOS
- Google Maps on Android

Fallback behavior must be defined when the preferred app is unavailable.

## Push notifications

Push is a later phase because it depends on:

- Permissions
- Device token registration
- Location matching
- Hazard matching
- Alert deduplication
- Severity rules
- Backend delivery
- Real-device development builds

Critical notifications must bypass application quiet-hour preferences where platform and policy allow. The product must not imply that it can override operating-system restrictions when it cannot.
