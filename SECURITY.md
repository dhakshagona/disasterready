# Security policy and current audit status

## Reporting

Do not open a public issue for a suspected vulnerability involving credentials or private data. Share a minimal reproduction privately with the repository owner once a security contact is published.

## Secret boundary

- The Expo client may contain only the Supabase project URL and publishable key.
- `GEMINI_API_KEY` and the Supabase service-role key are server-only.
- Local `.env` files are ignored. `.env.example` contains names only.
- Modern Supabase publishable keys are sent only in `apikey`; they are never treated as bearer credentials.
- Hosted secret keys and the Gemini key remain server-only.
- Edge Functions validate method, content type, actual body bytes, publishable key, exact input schema, per-client budget, and global budget.
- Rate-limit identifiers are salted hashes. Raw client addresses are not stored in PostgreSQL.
- Analytics client roles have no table access. The service role can execute only the bounded ingestion RPC and receives no direct analytics table privileges.

## Dependency audit on 2026-10-06

`npm audit --omit=dev --json` reports 64 affected package entries: 51 high, 13 moderate, and zero critical. npm aggregates dependency chains, so this count is not a count of distinct exploitable application paths.

Narrow lockfile overrides update `shell-quote` to 1.12.0, `source-map-js` to 1.2.2, and `nanoid` to 3.3.18. This removed the reported critical command-injection entry and two patchable build-tool entries without changing Expo or React Native versions.

The remaining findings are concentrated in Expo, React Native, Metro, Jest, Reanimated, Worklets, Xcode configuration, XML, YAML, image inspection, and certificate tooling. Current npm remediation suggestions include incompatible React Native changes or an Expo downgrade to SDK 44. Those are not safe fixes for an Expo SDK 57 application. `node-forge` also has no newer published release than the affected 1.4.0 at the time of this audit.

These packages are primarily used by local development, testing, asset inspection, native configuration, or build tooling. They do not parse NWS, FEMA, analytics, or Gemini payloads in the deployed Edge Functions. Builds must use trusted repository assets and an isolated CI runner. Track Expo SDK 57 compatible releases and rerun the audit before every release. Do not use `npm audit fix --force` because its proposed framework downgrades break the supported SDK graph.

## Hosted controls verified on 2026-10-06

- All four local Supabase migrations match the linked hosted project.
- `record-events`, `shelter-proxy`, and `simplify-alert` are active.
- `RATE_LIMIT_SALT` and `GEMINI_API_KEY` are configured as hosted secrets.
- Backend verification confirms direct client table and RPC access is denied.
- Backend verification confirms analytics ingestion, FEMA proxying, rate-limit access controls, and validated Gemini output.

## Production hardening still required

- Keep the Gemini project on the free tier with paid billing disabled.
- Review and approve Gemini unpaid-service data use before enabling the provider. Google uses unpaid-service inputs and outputs to improve its products, and human reviewers may read, annotate, and process them. Only public official alert text and approved deterministic context may be sent. Never send sensitive, confidential, personal, user-entered, contact, or device-location data.
- Schedule the batched 90-day analytics retention and expired rate-limit cleanup functions after reviewing production reporting requirements.
- Rotate any credential immediately if it ever enters Git history.
- Add branch protection, dependency update automation, and a supported private reporting channel.
- Re-run dependency and secret scans in CI on every release.
