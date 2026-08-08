# DisasterReady architecture

## Product boundary

DisasterReady is a mobile application first. The primary reference is an iPhone viewport near 390x844. Android uses the same presentation, application, and domain layers where practical. Desktop web centers the mobile shell and exists as a public demonstration surface, not as a dashboard variant.

## System diagram

```mermaid
flowchart TD
  subgraph Client["Expo SDK 57 client"]
    ROUTER["Expo Router screens"] --> CONTEXT["DisasterReady application context"]
    CONTEXT --> ALERTS["LiveAlertService"]
    CONTEXT --> RESOURCES["SafetyResourceService"]
    CONTEXT --> PLANS["Deterministic action-plan selector"]
    CONTEXT --> ANALYTICS["AnalyticsService"]
    CONTEXT --> PLAIN["PlainLanguageService"]
    CONTEXT --> PORTS["Storage, maps, and notification ports"]
    PORTS --> NATIVE["SQLite, Apple Maps or Google Maps, native permissions"]
    PORTS --> WEB["localStorage, universal map URL, explicit notification fallback"]
  end

  ALERTS --> NWS["api.weather.gov"]
  RESOURCES --> FEMA["FEMA National Shelter System"]
  ANALYTICS --> OUTBOX["Bounded local event outbox"]
  PLAIN --> DETERMINISTIC["Deterministic fallback"]
  OUTBOX --> RECORD["record-events Edge Function, optional"]
  PLAIN --> SIMPLIFY["simplify-alert Edge Function, optional"]
  RECORD --> POSTGRES["Supabase PostgreSQL"]
  SIMPLIFY --> OPENAI["OpenAI Responses API"]
  OPENAI --> CONTRACT["Strict JSON schema plus safety contract"]
  CONTRACT --> PLAIN
```

## Layer responsibilities

### Presentation

- Expo Router screens and mobile navigation
- Reusable UI primitives and design tokens
- Accessible names, roles, states, and minimum touch targets
- Loading, empty, offline, stale, demo, expired, and error disclosures
- No direct knowledge of NWS, FEMA, Supabase, or OpenAI response shapes

### Domain

- Normalized `Alert`, `ActionPlan`, `ActionStep`, `Shelter`, and `UserPreferences` models
- Reviewed action-plan templates
- Deterministic template selection
- Alert freshness and status concepts
- Notification eligibility and duplicate rules

### Application

- Alert retrieval and fallback orchestration
- Shelter retrieval and fallback orchestration
- Checklist and preference workflows
- Anonymous analytics event definitions
- Optional plain-language workflow with deterministic fallback

### Infrastructure

- NWS and FEMA clients, validators, and normalizers
- Native SQLite and browser localStorage adapters
- Platform notification adapters
- Apple Maps, Google Maps, and web routing adapters
- Supabase analytics and plain-language transports
- Supabase Edge Functions and migration

## Live alert flow

1. The saved location supplies a latitude and longitude point.
2. `NwsAlertClient` requests active alerts for that point with timeout and request throttling.
3. The normalizer rejects malformed features and maps supported hazards into internal models.
4. `LiveAlertService` filters status and hazard preferences, then writes the successful result to the local cache.
5. If live retrieval fails, the service returns saved data with its original retrieval time and a cached or stale label.
6. If neither source exists, the UI says data is unavailable. It does not imply an all-clear.

## Action-plan authority

The deterministic action-plan selector is the safety authority. It uses alert hazard and status to select reviewed, source-linked instructions. The language model does not select, reorder, add, or remove actions.

## Optional cloud boundary

Supabase is used only where it adds clear value:

- Store anonymous, aggregate product events after a strict allowlist check
- Keep the OpenAI credential off the client
- Apply a schema and safety check before AI wording reaches the app

Authentication, profile sync, saved-location sync, and server-side alert mirroring are deliberately not included. Guest access and local emergency readiness do not benefit enough from those dependencies at this stage.

## Data and trust boundaries

Client-safe configuration:

- Supabase project URL
- Supabase publishable key
- Public NWS and FEMA endpoints

Server-only configuration:

- OpenAI API key
- Supabase service-role key supplied by the Edge Function environment

The analytics table contains random event and session identifiers, event name, event time, real or demo mode, and allowlisted aggregate properties. It does not accept contact data, saved coordinates, city, or postal code.

## Offline behavior

- Preferences, checklist state, alerts, shelters, and the analytics outbox remain local.
- Alert results older than one hour are stale.
- Shelter results older than 30 minutes are stale.
- Failed cache reads or writes do not turn network failure into an all-clear.
- Analytics and AI failures never block the emergency flow.

## Direct web routes

The Expo web output uses single-page export mode. Hosting rewrites route unknown paths to `index.html`, allowing direct loads of mobile routes. Native-only capabilities expose explicit web fallbacks.
