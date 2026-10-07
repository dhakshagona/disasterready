# DisasterReady evidence methodology

## Purpose

This package measures whether DisasterReady processes official alerts reliably, fails safely, preserves official instructions, and helps people complete simulated emergency tasks. It does not claim that the application predicts emergencies, guarantees shelter availability, or replaces official instructions.

## Measurement rules

1. Define a metric before collecting its result.
2. Preserve the source dataset, retrieval date, checksum, software revision, and runtime version.
3. Report actual results even when a target is missed.
4. Separate automated checks from human judgment.
5. Separate simulated activity from real activity.
6. Separate local CPU processing time from provider and network latency.
7. Do not convert missing data into a successful result.
8. Do not count deterministic fallbacks as successful AI generations.

## NWS replay definitions

### Attempted record

A distinct official NWS GeoJSON alert feature selected by the published dataset manifest.

### Pipeline completion

The production normalizer returns a typed alert without an uncaught exception, and the deterministic action-plan selector completes for that alert.

### Classification agreement

The normalized DisasterReady hazard matches the reviewed event-name taxonomy stored with the evidence tooling. The production classifier is not used as its own expected answer.

### Action-plan coverage

An active supported hazard receives the reviewed deterministic template expected for its category. Alerts classified as `other` are reported separately and do not receive invented actions.

### Processing latency

Elapsed local CPU wall time for normalization, classification, and deterministic action-plan selection. It excludes NWS request time, mobile rendering, notification delivery, and user interaction.

## Dataset selection

The collector uses official NWS alert data and preserves distinct provider identifiers. The primary source is the public NWS alert API. That API covers only the previous seven days, so a longer official archive may be required when the live window does not contain five supported categories.

The report includes both the overall distribution and category-level results. A balanced evaluation set must not be presented as the natural national distribution of hazards.

## Reliability scenarios

The failure matrix uses a fixed seed and records each scenario name, variation, expected invariant, measured outcome, and error. Repeating a scenario with different payload details counts as a separate run only when the changed detail can exercise a different branch or boundary.

## AI evaluation

The deterministic action-plan engine remains the authority. Gemini receives only public official alert text, the hazard category, and the deterministic summary. When NWS supplies a dedicated instruction field, that field is the model source. Otherwise the official description is used. Automated graders check schema, critical terms, directive polarity, and numeric facts. Human reviewers decide semantic clarity and dangerous contradiction severity.

Each evaluation input has a SHA-256 digest over the hazard, official source text, and deterministic summary. A hosted attempt counts only when its stored digest matches the current case. This prevents results from an earlier prompt or input-selection design from being silently reused.

## Human evidence

Usability and expert-review documents are preparation artifacts until real people complete them. Reports must clearly distinguish proposed targets from achieved outcomes. Names, precise locations, private emergency histories, recordings, and unrelated personal data are excluded from public evidence.
