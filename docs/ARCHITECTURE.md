# DisasterReady Architecture

## Current local-first architecture

The iPhone-first Expo application shares domain and application code across iOS, Android, and web. Provider, storage, and routing differences stay behind adapters.

```text
Expo Router screens and feature components
  -> DisasterReady application context
      -> LiveAlertService
          -> NwsAlertSource -> NwsAlertClient -> api.weather.gov
          -> LocalAlertCache
          -> deterministic action-plan selector
      -> LocalPreferencesRepository
      -> LocalChecklistProgressRepository
  -> platform adapters
      -> iOS/Android: expo-sqlite key-value store
      -> web: localStorage
      -> iOS: Apple Maps preferred, Apple Maps web fallback
      -> Android: Google Maps navigation preferred, Google Maps web fallback
      -> web: Google Maps universal URL
```

The centered web shell remains a demonstration surface. The primary interaction reference is an iPhone-sized viewport around 390x844.

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

Implemented:

- `NwsAlertClient` and `NwsAlertSource`
- provider-boundary validation and normalization
- native SQLite and browser localStorage adapters
- local alert, preference, and checklist repositories
- platform-aware external map routing

Deferred:

- verified shelter-source adapter
- notification adapter and backend delivery
- optional Supabase profile sync

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

The current implementation caches:

- Preferences
- Last successful alert results
- Checklist progress
- Last update timestamps

Alert responses older than one hour are marked stale. If the live request fails, the UI either discloses the saved response and its retrieval time or shows an explicit unavailable state. It never converts a failed request into an all-clear.

NWS requests are limited to one request per saved location within a 30-second window. Network, HTTP, timeout, malformed-payload, cache-read, and cache-write failures have explicit tested behavior.

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

`MapRoutingService` implements this handoff without embedding turn-by-turn navigation. It is ready for a verified destination once a shelter or safety-resource source is selected.

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
