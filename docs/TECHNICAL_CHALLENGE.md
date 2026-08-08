# Hard technical problem: truthful emergency state under unreliable data

The strongest engineering problem in DisasterReady was not drawing an alert card. It was preserving truthful state while several independent systems could be slow, stale, malformed, unavailable, or simulated.

## Why it was difficult

A failed weather request must not look like no danger. A cached warning must not look current. A demo must not look live. A shelter record must not imply capacity. A language model must not quietly alter an instruction. Those failures can share the same visually calm empty screen if the architecture does not preserve provenance and freshness.

## Design response

DisasterReady makes trust state part of its typed model and application flow:

- Provider payloads are validated and normalized before components see them.
- Successful retrieval time is stored with cached alerts and shelters.
- Network failure returns a saved response only with cached or stale disclosure.
- No live or saved response produces an unavailable state, never an all-clear.
- Demo content has a durable `isDemo` flag and separate analytics mode.
- Action plans are selected by deterministic reviewed rules.
- AI output is optional, schema-bound, safety-checked, and replaceable by the deterministic summary at every failure point.

## The key invariant

The interface may reduce certainty, but it may not silently increase certainty.

That invariant shaped the cache APIs, freshness thresholds, demo banners, error copy, analytics modes, AI fallback reasons, and tests.

## Verification strategy

The test suite exercises:

- NWS request construction, validation, normalization, throttling, timeout, and source metadata
- FEMA client, source, distance ordering, status disclosure, and cache behavior
- current, cached, stale, unavailable, active, and expired alert paths
- deterministic plan selection and checklist persistence
- notification permission and eligibility rules
- platform map URLs
- analytics queue retention and server allowlists
- AI response extraction, exact schema, directive preservation, numeric preservation, and fallback reasons
- web single-page export configuration and direct-route rewrites

## Remaining production work

Real-device network transitions, push delivery, production Edge Function rate limits, and representative AI evaluation require external accounts and test infrastructure. Those gaps are documented rather than simulated.
