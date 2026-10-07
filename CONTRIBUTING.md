# Contributing to DisasterReady

DisasterReady is safety-sensitive. Small changes can affect what a person sees during an emergency.

## Before changing code

- Read `AGENTS.md` and the exact Expo SDK 57 documentation.
- Preserve the locked iPhone-first visual system unless fixing a verified bug.
- Keep deterministic reviewed action plans as the safety authority.
- Never fabricate shelter availability, official wording, user evidence, analytics, or external review.
- Keep secrets out of the client and repository.
- Do not use the prohibited Unicode punctuation character documented in `AGENTS.md`.

## Verification

Run:

```bash
npm run verify:release
npm run verify:evidence
```

Add focused tests for provider boundaries, failure behavior, and accessibility labels. When a safety-related behavior changes, update the evidence methodology and explain the changed denominator or corpus.

## Pull requests

Describe the user-facing behavior, safety impact, fallback behavior, and verification performed. Include screenshots only when presentation changed. Do not include private user-test records, credentials, precise participant locations, or unpublished reviewer identities.
