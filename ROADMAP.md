# DisasterReady engineering roadmap

This roadmap separates verified implementation from credential-gated and research-gated work.

## Phase 1: mobile product foundation

- [x] Establish the iPhone-first design system and centered web shell
- [x] Build guest onboarding, accessibility settings, home, alerts, detail, checklist, shelters, and settings
- [x] Add typed domain models and accessible UI primitives
- [x] Add lint, strict typecheck, component tests, and Visual Checkpoint 1

## Phase 2: live alerts and deterministic plans

- [x] Add NWS retrieval, provider validation, normalization, filtering, caching, and failure behavior
- [x] Add reviewed FEMA and Ready.gov action-plan templates
- [x] Persist preferences and checklist progress locally
- [x] Verify alert-to-plan behavior and Visual Checkpoint 2

## Phase 3: safety resources and native adapters

- [x] Add FEMA shelter normalization, freshness, status, empty, and failure states
- [x] Add Apple Maps, Google Maps, and web routing behavior
- [x] Add native notification permission adapters and deterministic eligibility rules
- [x] Verify the mobile UX and complete Visual Checkpoint 3

## Phase 4: useful optional backend

- [x] Add a minimal analytics schema with Row Level Security and no public table access
- [x] Add a bounded local analytics outbox and server allowlist
- [x] Separate every demo event from real activity
- [x] Add server-side OpenAI Responses API integration with strict structured output
- [x] Share schema and safety checks across the server and client
- [x] Guarantee deterministic fallback for missing configuration, timeout, provider failure, malformed output, refusal, and safety mismatch
- [x] Keep accounts, profile sync, and public alert mirroring out of scope until they solve a demonstrated need

## Phase 5: flagship evidence and release preparation

- [x] Add SPA export and direct-route host fallbacks
- [x] Replace the starter README with a product and engineering overview
- [x] Add Mermaid architecture, decision records, AI safety, metric glossary, and technical challenge write-up
- [x] Add a structured user-testing protocol with no invented outcomes
- [ ] Run the full native accessibility and reduced-motion audit on devices
- [ ] Conduct the user test and record only observed findings
- [ ] Create Supabase and OpenAI accounts, deploy functions, and validate production limits
- [ ] Create the Vercel project and publish the public demo URL
- [ ] Configure EAS and remote push delivery
- [ ] Final GitHub and deployment approval

## External requirements

- Supabase project and CLI authentication
- OpenAI project key stored only as an Edge Function secret
- Vercel or equivalent hosting account
- EAS project ID and native push credentials for remote delivery
- Representative participants for user testing
- Public source for historical recognition wording
