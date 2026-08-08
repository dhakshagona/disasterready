# AI safety contract

## Scope

The optional AI capability rewrites official alert wording into a shorter plain-language summary. It does not create action plans, determine severity, choose shelters, trigger notifications, or replace official text.

## Server boundary

The client calls the `simplify-alert` Supabase Edge Function with:

- normalized hazard category
- official alert text
- existing deterministic summary as context

The OpenAI API key is stored only as an Edge Function secret. The default model is `gpt-5.6-luna`, selected for a bounded, cost-sensitive transformation. `OPENAI_MODEL` can override it after evaluation.

The function uses the Responses API with a strict JSON schema:

```json
{
  "plainSummary": "string between 30 and 500 characters"
}
```

Additional properties are rejected.

## Safety validation

After schema parsing, the shared contract rejects output that:

- removes a critical prohibition or urgency phrase found in the original
- removes a directive term found in the original
- introduces a directive term not found in the original
- adds, removes, or changes a numeric token
- exceeds the length contract

The client runs the same schema and safety validation after the server response.

## Deterministic fallback reasons

- `not-configured`: no server API key exists
- `unsupported`: demo or empty official content
- `timeout`: the client or server deadline elapsed
- `provider-error`: network or provider failure
- `schema-invalid`: missing, refused, non-JSON, or contract-invalid output
- `safety-invalid`: wording failed the safety-preservation test

Each reason returns the existing deterministic summary. The action plan is never modified.

## UI disclosure

Validated output is labeled `AI simplified`. The screen states that it is optional wording and keeps the official alert text, source, and deterministic actions visible.

## Known limitation

Phrase-based validation is intentionally conservative, but it is not a clinical or formal verification system. Production enablement requires representative alert evaluation, latency and cost monitoring, abuse controls, and review of failure samples. AI should remain optional.
