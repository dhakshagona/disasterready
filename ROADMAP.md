# DisasterReady Engineering Roadmap

This roadmap is intentionally explicit about what is real, what is simulated, and what remains.

## Phase 1: Frontend foundation (current milestone)

- [x] Review the product, architecture, phase brief, Expo SDK 57 docs, and prototype references
- [x] Establish a restrained emergency-response design system
- [x] Define typed domain models and local mock repositories
- [x] Build reusable, accessible UI primitives
- [x] Build guest onboarding and accessibility setup
- [x] Build Home in no-alert and clearly labeled demo-alert states
- [x] Build alert detail, action plan, alerts list, shelter state, and settings screens
- [x] Add lint, strict typecheck, and component tests
- [x] Complete visual review checkpoint 1

Phase 1 established the visual and navigational foundation. Live alerts and local persistence were added in Phase 2; authentication, push notifications, and real shelter lookup remain deferred.

## Phase 2: Local-first product core

- [x] Persist onboarding, preferences, selected location, and checklist progress locally
- [x] Add reviewed, source-linked deterministic action-plan templates
- [x] Add the National Weather Service adapter, validation, normalization, and filtering
- [x] Add current, cached, expired, stale, offline, and failure behavior
- [x] Replace static timestamps and demo-only controls with application services
- [x] Add integration tests around the alert-to-plan flow
- [x] Complete visual review checkpoint 2

## Phase 3: Safety resources and native capabilities

- [x] Select and document a verifiable shelter/safety-resource source
- [x] Implement shelter normalization, freshness, and explicit unknown/open/closed states
- [x] Add Apple Maps and Google Maps deep links without in-app turn-by-turn navigation
- [x] Add native notification permissions and development-build setup
- [x] Add deterministic alert deduplication, hazard matching, and severity rules
- [ ] Configure the EAS project, push credentials, backend token registration, and delivery
- [ ] Complete visual review checkpoint 3

## Phase 4: Optional cloud sync and constrained AI

- [ ] Add optional Supabase authentication and guest-safe migration
- [ ] Add PostgreSQL schema, migrations, and Row Level Security
- [ ] Sync saved locations and preferences without making emergency access account-dependent
- [ ] Add a server-side, schema-validated plain-language transformation layer
- [ ] Guarantee deterministic fallback for timeout, malformed output, unsupported alerts, and AI unavailability

## Phase 5: Evidence, hardening, and release

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
- EAS project ID, native push credentials, and a token-registration backend
- Deployment account/project
- Real user-testing results and production metrics
