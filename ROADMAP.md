# DisasterReady Engineering Roadmap

This roadmap is intentionally explicit about what is real, what is simulated, and what remains.

## Phase 1 — Frontend foundation (current milestone)

- [x] Review the product, architecture, phase brief, Expo SDK 57 docs, and prototype references
- [x] Establish a restrained emergency-response design system
- [x] Define typed domain models and local mock repositories
- [x] Build reusable, accessible UI primitives
- [x] Build guest onboarding and accessibility setup
- [x] Build Home in no-alert and clearly labeled demo-alert states
- [x] Build alert detail, action plan, alerts list, shelter state, and settings screens
- [x] Add lint, strict typecheck, and component tests
- [ ] Complete visual review checkpoint 1

Phase 1 contains no live alert feed, authentication, remote storage, push notifications, or real shelter lookup.

## Phase 2 — Local-first product core

- [ ] Persist onboarding, preferences, selected location, and checklist progress locally
- [ ] Add reviewed, source-linked deterministic action-plan templates
- [ ] Add the National Weather Service adapter, validation, normalization, and filtering
- [ ] Add current, cached, expired, stale, offline, and failure behavior
- [ ] Replace static timestamps and demo-only controls with application services
- [ ] Add integration tests around the alert-to-plan flow

## Phase 3 — Safety resources and native capabilities

- [ ] Select and document a verifiable shelter/safety-resource source
- [ ] Implement shelter normalization, freshness, and explicit unknown/open/closed states
- [ ] Add Apple Maps and Google Maps deep links without in-app turn-by-turn navigation
- [ ] Add native notification permissions and development-build setup
- [ ] Add device-token registration, alert deduplication, matching, and severity rules

## Phase 4 — Optional cloud sync and constrained AI

- [ ] Add optional Supabase authentication and guest-safe migration
- [ ] Add PostgreSQL schema, migrations, and Row Level Security
- [ ] Sync saved locations and preferences without making emergency access account-dependent
- [ ] Add a server-side, schema-validated plain-language transformation layer
- [ ] Guarantee deterministic fallback for timeout, malformed output, unsupported alerts, and AI unavailability

## Phase 5 — Evidence, hardening, and release

- [ ] Accessibility and reduced-motion audit on native and web
- [ ] Failure-state, offline, and stale-data test matrix
- [ ] Small structured user test; record only observed results
- [ ] Truthful analytics with demo activity separated from real activity
- [ ] Architecture diagram, screenshots/GIF, and technical challenge write-up
- [ ] Production README and web deployment
- [ ] Final visual/product approval

## External requirements not yet available

- Supabase project configuration
- Any private AI provider credential (server-side only)
- A verified shelter data provider and its terms
- Deployment account/project
- Real user-testing results and production metrics
