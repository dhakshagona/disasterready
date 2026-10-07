# DisasterReady evidence index

This directory separates implemented capability, reproducible engineering evidence, and work that still requires real people or external credentials.

## Current reproducible results

| Evidence | Result | Artifact |
| --- | --- | --- |
| Official NWS replay | 1,000 records, 100% ingest, 100% taxonomy agreement, zero crashes | [NWS replay report](../../evidence/results/nws-replay-report.md) |
| Deterministic action plans | 100% coverage for 556 eligible supported active alerts | [NWS replay report](../../evidence/results/nws-replay-report.md) |
| Local CPU pipeline latency | 0.006 ms median, 0.016 ms p95 on the recorded run | [NWS replay report](../../evidence/results/nws-replay-report.md) |
| Failure matrix | 148 of 148 controlled scenarios passed | [Reliability matrix](../../evidence/results/reliability-matrix-report.md) |
| AI safety evaluation | 40-case pilot complete, refreshed 100-case run pending | [AI safety pilot](../../evidence/results/ai-safety-pilot-report.md) |
| Usability study | Protocol and calculator ready, real sessions pending | [Usability report](../../evidence/results/usability-report.md) |
| Expert review | Packet ready, independent reviews pending | [Expert review packet](../expert-review/REVIEW_PACKET.md) |

The latency result measures local normalization and deterministic plan selection. It does not include network requests, rendering, notification delivery, or user interaction.

## Reproduce the engineering evidence

Use Node.js 22.13 or newer, install the locked dependencies, then run:

```bash
npm ci
npm run verify:release
npm run verify:evidence
```

`verify:evidence` replays the frozen official NWS corpus and reruns the controlled reliability matrix. It does not download fresh alerts or claim completion of human-gated studies.

To refresh the corpus from the official NWS API:

```bash
npm run evidence:nws:collect
npm run evidence:nws:replay -- --strict
npm run evidence:ai:prepare
```

Refreshing changes the dataset hash and the population being measured. Keep the previous report when making longitudinal comparisons.

## Data provenance

- The NWS dataset manifest records the exact collection window, paginated source URLs, selection method, category counts, and SHA-256 digest.
- The frozen corpus contains public official alert records only.
- AI evaluation inputs are selected deterministically from the frozen corpus after production normalization.
- Private model attempts, user-study observations, recordings, and reviewer identities are excluded from version control.

## Claim rules

- Report denominators, dataset hashes, dates, and exclusions with every metric.
- Do not turn a controlled harness result into a claim about production uptime or real emergency outcomes.
- Do not claim user-study, expert-review, AI-quality, or deployment results until their evidence files contain real completed records.
- Never infer admission outcomes, public adoption, or official endorsement from repository quality.
