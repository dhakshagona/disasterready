# DisasterReady expert review packet

## Purpose

DisasterReady requests a focused independent review from two or three people with relevant experience in emergency management, public safety communication, accessibility, or resilient mobile systems. The goal is to identify safety, trust, and failure-state problems before public release.

This is not an endorsement request. Reviewers may decline to have their name or affiliation published.

## Product boundary

- iPhone-first emergency companion with Android and web support
- official NWS alerts and FEMA-reported shelter data
- deterministic, reviewed action plans as the safety authority
- optional AI wording that cannot change action plans
- offline display of cached alerts, cached shelter data, and local checklists
- clear separation between simulated and real information

## Review flow

1. Open the active flood demo.
2. Identify whether the alert is real or simulated.
3. Open Alert Detail and find the official source.
4. Open Emergency Checklist and inspect the first three actions.
5. Open Safety Route and examine destination and availability wording.
6. Review a cached, stale, and unavailable state using the supplied screenshots or test build.
7. Review the AI safety boundary in `docs/AI_SAFETY.md`.

## Questions

1. Could any state be mistaken for an official all-clear?
2. Does any action wording create unsafe ambiguity or imply certainty that the source does not provide?
3. Is shelter availability represented accurately?
4. Can a person under stress find the first safe action quickly?
5. Are demo, cached, stale, unavailable, official, and AI-generated information visually and verbally distinct?
6. What are the three highest-priority changes before public release?

## Evidence requested

Use `FINDINGS_TEMPLATE.csv`. Record an observation, its safety or usability impact, supporting evidence, severity, and recommended response. Do not include personal emergency histories, precise home locations, or unrelated sensitive information.

## Severity scale

- Critical: could directly encourage unsafe action or hide an active emergency state
- High: could materially delay or confuse an emergency decision
- Medium: creates avoidable friction, uncertainty, or accessibility risk
- Low: clarity or polish improvement with limited safety impact

## Publication consent

The project will not publish a reviewer name, title, affiliation, quote, or endorsement without explicit written permission. Anonymous findings can still guide implementation.
