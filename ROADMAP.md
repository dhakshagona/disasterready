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
- [x] Share exact event schemas across client storage, transport, and Edge ingestion
- [x] Separate every demo event from real activity
- [x] Add server receipt-time reporting, least-privilege grants, and bounded retention
- [x] Add a provider-neutral server integration with Gemini free-tier structured output
- [x] Share schema and safety checks across the server and client
- [x] Guarantee deterministic fallback for missing configuration, timeout, provider failure, malformed output, refusal, and safety mismatch
- [x] Add actual request byte limits plus per-client and global budgets for public functions
- [x] Add a bounded FEMA shelter proxy with direct official-source fallback
- [x] Keep accounts, profile sync, and public alert mirroring out of scope until they solve a demonstrated need

## Phase 5: flagship evidence and release preparation

- [x] Add SPA export and direct-route host fallbacks
- [x] Replace the starter README with a product and engineering overview
- [x] Add Mermaid architecture, decision records, AI safety, metric glossary, and technical challenge write-up
- [x] Add a structured user-testing protocol with no invented outcomes
- [x] Pin the Supabase CLI and add backend and release verification commands
- [x] Lock the approved mobile design system against unplanned visual changes
- [x] Freeze and replay 1,000 official NWS alerts with provenance and failure accounting
- [x] Pass the 99% ingestion, 98% taxonomy-agreement, latency, and zero-crash targets
- [x] Run 148 controlled failure and offline-recovery scenarios
- [x] Add a 100-alert AI evaluation dataset, collector, scorer, and human-review sheet
- [x] Add a 30 to 50 participant protocol, three standard scenarios, SUS templates, and aggregate calculator
- [x] Add a two to three reviewer expert packet and finding log
- [x] Add reproducible evidence verification to CI
- [ ] Run the full native accessibility and reduced-motion audit on devices
- [ ] Conduct 30 to 50 real usability sessions and record only observed findings
- [ ] Complete two to three independent expert reviews and implement the accepted high-priority findings
- [ ] Create a Gemini API free-tier key and complete the 100-alert hosted model evaluation
- [ ] Create the Vercel project and publish the public demo URL
- [ ] Configure EAS and remote push delivery
- [ ] Final GitHub and deployment approval

## External requirements

- Supabase project and CLI authentication
- Gemini API key stored only as an Edge Function secret
- Vercel or equivalent hosting account
- EAS project ID and native push credentials for remote delivery
- Representative participants for user testing
- Public source for historical recognition wording
