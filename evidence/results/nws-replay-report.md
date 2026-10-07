# NWS replay benchmark

Generated: 2026-10-07T01:14:26.322Z

Dataset SHA-256: `f3823277203daa93728e7a8ba6e34de4f1b82bb9d133edf575bf9bebfb03a9e2`

## Results

| Metric | Result |
| --- | ---: |
| Attempted records | 1000 |
| Accepted records | 1000 |
| Pipeline completion | 100% |
| Classification agreement | 100% |
| Represented categories | 7 |
| Action-plan coverage | 100% |
| Median CPU latency | 0.006 ms |
| p95 CPU latency | 0.016 ms |
| Maximum CPU latency | 1.156 ms |
| Uncaught crashes | 0 |

CPU latency excludes NWS requests, rendering, notification delivery, and user interaction.

## Category results

| Hazard | Attempted | Accepted | Classification agreement | Plans created |
| --- | ---: | ---: | ---: | ---: |
| air-quality | 4 | 4 | 100% | 4 |
| flood | 374 | 374 | 100% | 320 |
| hurricane | 28 | 28 | 100% | 26 |
| other | 373 | 373 | 100% | 0 |
| tornado | 16 | 16 | 100% | 11 |
| wildfire | 17 | 17 | 100% | 13 |
| winter-storm | 188 | 188 | 100% | 182 |

## Target check

| Target | Result |
| --- | --- |
| recordsAtLeast1000 | PASS |
| categoriesAtLeast5 | PASS |
| pipelineCompletionAtLeast99Percent | PASS |
| classificationAgreementAtLeast98Percent | PASS |
| medianCpuLatencyBelow2000Ms | PASS |
| p95CpuLatencyBelow5000Ms | PASS |
| zeroCrashes | PASS |

## Failure accounting

Failures recorded: 0. Machine-readable details are in the JSON report. Missing or rejected records remain in the denominator.
