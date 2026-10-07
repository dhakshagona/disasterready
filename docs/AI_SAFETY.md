# AI safety contract

## Scope

The optional AI capability rewrites official alert wording into a shorter plain-language summary. It does not create action plans, determine severity, choose shelters, trigger notifications, or replace official text.

## Server boundary

The client calls the `simplify-alert` Supabase Edge Function with:

- normalized hazard category
- the official NWS instruction when present, otherwise the official alert description
- existing deterministic summary as context

Alert Detail always retains the complete official description and instruction. Selecting the focused official instruction for simplification avoids asking the model to compress unrelated bulletin detail while preserving the authoritative safety wording.

The server depends on a provider-neutral `PlainLanguageModelProvider` port. The active adapter uses `gemini-3.5-flash-lite`, which Google lists for free-tier text input and output. The model name is fixed in code so configuration cannot silently select a paid-only model. `GEMINI_API_KEY` is stored only as an Edge Function secret.

The official NWS alert text and approved deterministic summary are sent to Gemini for this optional transformation. Under Google's unpaid-service terms, Google uses submitted content and generated responses to provide, improve, and develop its products and machine-learning technologies. Human reviewers may read, annotate, and process inputs and outputs. DisasterReady must send only public official alert content and reviewed deterministic context. Never send sensitive, confidential, personal, user-entered, contact, or device-location data. Review the current [Gemini API terms](https://ai.google.dev/gemini-api/terms) and [pricing](https://ai.google.dev/gemini-api/docs/pricing) before production enablement.

The Gemini adapter uses `generateContent` with an exact JSON object shape. The shared parser separately enforces the 30-to-500-character bound:

```json
{
  "plainSummary": "string between 30 and 500 characters"
}
```

Additional properties are rejected.

The request enables no provider tools, search grounding, maps grounding, caching, batch processing, or other paid-only capability. Requests use a five-second upstream deadline and pass through atomic per-client and global database-backed minute and daily budgets before the Gemini call. The client deadline is longer than the server deadline so a provider request is not left running after the app has already fallen back.

## Safety validation

After schema parsing, the shared contract rejects output that:

- removes a critical prohibition or urgency phrase found in the original
- removes a directive term found in the original
- introduces a directive term not found in the original
- introduces a critical qualifier or negation not found in the original
- adds, removes, changes, or reorders a numeric fact or its unit within a safety clause
- changes a directive between affirmative and negated meaning
- exceeds the length contract

The client runs the same schema and safety validation after the server response.

## Deterministic fallback reasons

- `not-configured`: no server API key exists
- `unsupported`: demo or empty official content
- `timeout`: the client or server deadline elapsed
- `provider-error`: network or provider failure
- `rate-limited`: the optional AI request budget is exhausted
- `schema-invalid`: missing, refused, non-JSON, or contract-invalid output
- `safety-invalid`: wording failed the safety-preservation test

Each reason returns the existing deterministic summary. The action plan is never modified.

## UI disclosure

Validated output is labeled `AI simplified`. The screen states that it is optional wording and keeps the official alert text, source, and deterministic actions visible.

## Known limitation

Phrase-based validation is intentionally conservative, but it is not a clinical or formal verification system. Production enablement requires representative alert evaluation, latency and quota monitoring, confirmation that the free-tier model is available to the project, review of failure samples, paid billing remaining disabled, and approval of the provider data-use posture. AI should remain optional.
