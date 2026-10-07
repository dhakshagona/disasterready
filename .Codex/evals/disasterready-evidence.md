# EVAL DEFINITION: DisasterReady reliability evidence

## Scope

This evaluation verifies the evidence-building work for DisasterReady without changing the locked visual system or allowing optional AI output to become safety authority.

## Capability evals

1. Collect at least 1,000 distinct official NWS alert records with source provenance and a content checksum.
2. Replay every record through the production normalizer and deterministic action-plan selector.
3. Report accepted records, rejected records, hazard agreement, action-plan coverage, crash count, and CPU latency percentiles.
4. Run at least 100 seeded failure scenarios across duplicate, lifecycle, malformed-data, provider-failure, storage-failure, and offline conditions.
5. Prepare a 100-record AI safety evaluation set and reject outputs that alter critical directives or numeric facts.
6. Calculate usability outcomes and System Usability Scale scores from deidentified session records.
7. Generate machine-readable and human-readable evidence artifacts without inventing human results.

## Regression evals

1. Existing NWS retrieval and normalization tests pass.
2. Existing deterministic action-plan tests pass.
3. Existing cache, notification, shelter, analytics, and AI fallback tests pass.
4. Expo lint and strict TypeScript checks pass.
5. Web export succeeds.
6. Repository-authored text contains no prohibited Unicode punctuation.
7. The iPhone-first interface remains visually unchanged unless a reliability defect requires a small correction.

## Safety invariants

1. Unavailable data never appears as an all-clear.
2. Cached data never appears current.
3. Demo data never generates real notifications or real analytics.
4. Gemini never selects, removes, or invents an emergency action.
5. Every Gemini failure preserves deterministic content.
6. No participant, expert, or benchmark outcome is fabricated.

## Acceptance thresholds

- Dataset size: at least 1,000 distinct records
- Hazard categories: at least 5
- Pipeline completion target: at least 99 percent
- Classification agreement target: at least 98 percent
- Crash count: 0
- Seeded failure scenarios: at least 100
- Duplicate notifications in duplicate scenarios: 0
- Dangerous AI contradictions target: 0
- Release regression checks: 100 percent passing

Targets that are not met remain reported as measured failures. They are not edited out or redefined after a run.

## Human review required

- Semantic AI clarity and contradiction severity
- Real participant usability sessions
- Real expert review
- Any visual change

