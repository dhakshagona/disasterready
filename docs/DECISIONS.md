# Technical decisions

## ADR 001: iPhone-first shared Expo application

Status: accepted

The primary interaction target is iOS at approximately 390x844. Expo Router and React Native keep presentation and domain code shared. The desktop web surface centers the mobile shell rather than introducing a dashboard information architecture.

Consequence: mobile reachability, fast scanning, touch size, and offline disclosure take priority over desktop information density.

## ADR 002: local guest mode is the default

Status: accepted

Emergency access must not depend on account creation or a cloud round trip. Preferences, cache entries, and checklist progress are stored on device.

Consequence: profile synchronization is deferred until it solves a demonstrated user need.

## ADR 003: public providers are normalized behind ports

Status: accepted

NWS and FEMA payloads never enter components directly. Infrastructure adapters validate provider data and return internal domain models.

Consequence: provider changes stay localized and can be tested with fixtures.

## ADR 004: deterministic rules own safety actions

Status: accepted

Reviewed templates and deterministic selection rules create the action plan. AI can optionally simplify official wording only.

Consequence: AI failure cannot remove the checklist or change its authority.

## ADR 005: Supabase is narrow and optional

Status: accepted

Supabase stores allowlisted aggregate analytics and hosts the secret-bearing AI adapter. It is not used for decorative profile tables, duplicate public alert storage, or account requirements.

Consequence: the useful live app works with no backend account. Cloud setup adds measurement and optional wording, not core safety availability.

## ADR 006: analytics separate real and demo modes

Status: accepted

Every analytics event carries an explicit `real` or `demo` mode. Demo sessions are never counted as evidence of real alert usage.

Consequence: reports must group by mode and may not combine the two into a product claim.

## ADR 007: web exports as one mobile SPA

Status: accepted

Expo web uses `single` output with host rewrites to `index.html`.

Consequence: nested routes load directly on public demo hosts while retaining the centered mobile experience.

## ADR 008: public cloud functions use bounded anonymous access

Status: accepted

Modern Supabase publishable keys are public configuration, not user identity or bearer tokens. Edge Functions validate the `apikey`, actual body size, exact contract, per-client budget, and global budget. Database writes use a hosted secret key and least-privilege grants.

Consequence: the optional backend can support guest access without misrepresenting a public key as authentication. Telemetry remains anonymous and untrusted, and paid AI work stays behind explicit cost controls.

## ADR 009: shelter proxy fails back to the official public source

Status: accepted

When Supabase is configured, FEMA shelter requests use the Edge Function first. A proxy failure falls back to the direct public FEMA endpoint and the same client normalizer.

Consequence: centralized validation and rate limits improve the public demo without making shelter lookup depend on the optional backend.
