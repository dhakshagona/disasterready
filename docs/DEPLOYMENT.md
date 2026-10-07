# Deployment guide

The core app runs without Supabase or Gemini. The steps below enable the optional shelter proxy, remote analytics, AI wording, and a public web URL. They require external accounts and cannot be completed from this repository alone.

## 1. Create and link a Supabase project

The repository pins Supabase CLI 2.113.0 as a development dependency.

1. Create a Supabase project.
2. Run `npx supabase login`.
3. Copy the project reference from the Supabase dashboard.
4. Run `npx supabase link --project-ref YOUR_PROJECT_REF`.
5. Run `npx supabase db push` to apply the complete migration ledger.

Do not paste individual migration files into production. `supabase db push` records each migration and prevents silent schema drift.

## 2. Confirm the database boundary

The migrations create:

- `public.analytics_events`, with RLS enabled and no client policies
- `public.analytics_daily_counts`, a server-controlled reporting view grouped by `real` and `demo`
- `private.edge_rate_limits`, with no client access
- `public.consume_edge_rate_limits`, executable only by `service_role`
- `public.delete_expired_analytics_events`, executable only by `service_role`
- `public.delete_expired_edge_rate_limits`, executable only by `service_role`

The service role can execute the bounded `ingest_analytics_events` function, but it receives no direct table privileges. The function validates the database batch shape and performs deduplicated inserts. Direct `anon` and `authenticated` access is revoked.

## 3. Configure function secrets

Supabase provides modern hosted keys through the `SUPABASE_PUBLISHABLE_KEYS` and `SUPABASE_SECRET_KEYS` environment dictionaries. The functions also support legacy hosted keys during migration. Do not create custom secrets with names that begin with `SUPABASE_`.

Create these project secrets:

```text
RATE_LIMIT_SALT=a long random value unique to this deployment
GEMINI_API_KEY=a server-only Google AI Studio key from a project with paid billing disabled
```

`GEMINI_API_KEY` and `RATE_LIMIT_SALT` must never enter Expo, the web host, Git history, logs, or screenshots. Keep paid billing disabled for the Gemini project.

The provider adapter is fixed to `gemini-3.5-flash-lite`, a short-text model listed on the Gemini API free tier when this integration was implemented. The request enables no tools, grounding, caching, batch processing, or other paid-only capability. Free-tier availability and rate limits can change, so quota or provider failure must retain deterministic content.

Google's unpaid-service terms state that Google uses submitted content and generated responses to improve its products and machine-learning technologies, and that human reviewers may process inputs and outputs. Approve this data-use posture before enabling Gemini. Send only public official alert content and reviewed deterministic context. Never send sensitive, confidential, personal, user-entered, contact, or device-location data.

## 4. Deploy Edge Functions

Run:

```bash
npx supabase functions deploy record-events
npx supabase functions deploy simplify-alert
npx supabase functions deploy shelter-proxy
```

The functions use `verify_jwt = false` because modern publishable keys are not user JWTs. Each handler validates the `apikey`, method, content type, actual body size, exact input schema, per-client request budget, and global request budget. A publishable key is public and is not proof of a trusted user.

Current limits:

| Function | Per client per minute | Per client per day | Global per minute | Global per day |
| --- | ---: | ---: | ---: | ---: |
| `record-events` | 10 requests | 1,000 events | 60 requests | 25,000 events |
| `simplify-alert` | 4 requests | 40 requests | 12 requests | 200 requests |
| `shelter-proxy` | 12 requests | 300 requests | 60 requests | 5,000 requests |

The database evaluates all applicable per-client and shared checks atomically, then charges every counter only when all checks allow the request. Rate limiting uses a salted hash of the network address supplied by the hosting edge. Requests without an address share one stable fallback bucket. It does not store the raw address. This is an abuse-reduction control, not strong identity or attestation. Verify the hosted gateway's client-IP header behavior and spoof resistance in staging.

## 5. Configure the client

Copy the project URL and publishable key into local `.env` and the web host environment:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

Only the publishable key is allowed in an `EXPO_PUBLIC_` variable. The client sends it in the `apikey` header and never treats it as a bearer token.

When configured, shelter lookup tries the Edge Function first and falls back to the direct public FEMA endpoint if the proxy is unavailable. No shelter destination is fabricated. Coordinates are used for the request and are not written to analytics.

## 6. Verify the deployed backend

Run:

```bash
npm run verify:backend
npm run verify:backend -- --include-ai
```

The first command confirms direct analytics table, reporting view, mutation, and rate-limit RPC access are denied. It also checks the FEMA proxy and accepts a clearly labeled demo analytics event. The second command requires the AI function to be configured and rejects missing-key or provider-configuration fallbacks.

Then verify in the Supabase dashboard:

1. `analytics_daily_counts` shows `real` and `demo` on separate rows.
2. No analytics row contains coordinates, city, postal code, contact data, alert text, or arbitrary properties.
3. Direct requests using the publishable key cannot select or mutate `analytics_events`.
4. Repeated requests reach the configured per-client and global limits.
5. Removing `GEMINI_API_KEY` returns the deterministic `not-configured` fallback.

Schedule `select public.delete_expired_analytics_events(90, 5000);` and `select public.delete_expired_edge_rate_limits(5000);` after verifying the Supabase Cron configuration. Both operations are deliberately batched. Run them frequently enough that repeated executions reach zero deleted rows. Analytics retention refuses values below 30 or above 3650 days.

## 7. Deploy the web demo

1. Import the GitHub repository into Vercel.
2. Set the framework preset to Other if automatic Expo detection does not apply.
3. Set the build command to `npm run build:web`.
4. Set the output directory to `dist`.
5. Add only the two `EXPO_PUBLIC_SUPABASE_` variables if cloud features are enabled.
6. Deploy and test direct loads of `/home?demo=1`, `/alerts`, `/shelters`, and `/settings`.
7. Run the user-testing smoke script and `npm run verify:release` against the exact release commit.
8. Add the verified public URL to `README.md`.

`vercel.json` rewrites direct routes to the Expo SPA. `public/_redirects` provides the equivalent fallback for Netlify-style static hosts.

## 8. Native release work

Remote push delivery is separate from local permissions and notification rules. It requires:

- Expo account and EAS project ID
- Apple and Android push credentials
- real-device development builds
- device-token registration API and protected database table
- scheduled or event-driven alert delivery worker
- opt-out, token rotation, duplicate, and delivery monitoring

Do not claim remote notification delivery until those steps are configured and verified on devices.
