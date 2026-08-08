# Deployment guide

The core app runs without Supabase or OpenAI. The steps below enable remote analytics, optional AI wording, and a public web URL. They require external accounts and cannot be completed from this repository alone.

## 1. Create a Supabase project

1. Create a project in the Supabase dashboard.
2. Install and authenticate the Supabase CLI.
3. Link this repository to the project.
4. Apply `supabase/migrations/20260808020000_create_analytics_events.sql`.
5. Copy the project URL and publishable key into local `.env` or the web host environment:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

## 2. Configure Edge Function secrets

Set these only in the Supabase Edge Function environment:

```text
SUPABASE_PUBLISHABLE_KEY=the same public key used by the client
OPENAI_API_KEY=server-only OpenAI project key
OPENAI_MODEL=gpt-5.6-luna
```

Supabase supplies `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to hosted Edge Functions. Never copy the service-role key into Expo or a web host public variable.

Deploy:

```bash
supabase functions deploy record-events
supabase functions deploy simplify-alert
```

Both functions use an explicit publishable-key check because the current publishable key format is not treated as a user JWT. Add production rate limits at the gateway or project edge before broad public launch.

## 3. Verify Supabase behavior

1. Start the app with the two public Expo variables.
2. Open live and demo flows.
3. Confirm `analytics_events` receives separate `real` and `demo` rows.
4. Confirm no row contains city, postal code, coordinates, contact data, or alert body text.
5. Enable plain language and open a real NWS alert.
6. Confirm validated wording is labeled and official text remains unchanged.
7. Temporarily remove `OPENAI_API_KEY` and confirm the deterministic summary remains with a `not-configured` fallback event.

## 4. Deploy the web demo to Vercel

1. Import the GitHub repository into Vercel.
2. Set the framework preset to Other if automatic Expo detection does not apply.
3. Set build command to `npm run build:web`.
4. Set output directory to `dist`.
5. Add only the two `EXPO_PUBLIC_SUPABASE_` variables if cloud features are enabled.
6. Deploy, then test direct loads of `/home?demo=1`, `/alerts`, `/shelters`, and `/settings`.
7. Add the final URL to `README.md`.

`vercel.json` rewrites direct routes to the Expo SPA. `public/_redirects` provides the equivalent fallback for Netlify-style static hosts.

## 5. Native release work

Remote push delivery is separate from local permissions and notification rules. It requires:

- Expo account and EAS project ID
- Apple and Android push credentials
- real-device development builds
- device-token registration API and protected database table
- scheduled or event-driven alert delivery worker
- opt-out, token rotation, duplicate, and delivery monitoring

Do not claim remote notification delivery until those steps are configured and verified on devices.
