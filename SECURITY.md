# Security policy and current audit status

## Reporting

Do not open a public issue for a suspected vulnerability involving credentials or private data. Share a minimal reproduction privately with the repository owner once a security contact is published.

## Secret boundary

- The Expo client may contain only the Supabase project URL and publishable key.
- `OPENAI_API_KEY` and the Supabase service-role key are server-only.
- Local `.env` files are ignored. `.env.example` contains names only.
- Edge Functions validate request size, method, publishable key, input schema, and property allowlists.

## Dependency audit on 2026-08-07

`npm audit --omit=dev --audit-level=high` reports transitive findings in Expo and Metro tooling:

- `image-size` 1.2.1 under Metro has two high-severity denial-of-service advisories for malformed ICNS, JXL, or HEIF input. The GitHub advisories currently list no patched version through 2.0.2.
- `uuid` 7.0.3 under Expo config plugin and Xcode tooling has a moderate buffer-bounds advisory affecting specific buffer-supplied UUID APIs.

npm suggests a forced Expo downgrade to SDK 53. That is not an acceptable fix for this SDK 57 project. The affected packages are reached through local native and web build tooling, not through DisasterReady alert, shelter, analytics, or AI request handling. Repository builds must use trusted, reviewed image assets and an isolated CI runner. Track Expo and Metro releases and update when a compatible patched dependency becomes available.

References:

- [image-size ICNS advisory](https://github.com/advisories/GHSA-w3rx-r6r6-pgpr)
- [image-size JXL and HEIF advisory](https://github.com/advisories/GHSA-5p2g-fcmc-qvqq)
- [uuid advisory](https://github.com/advisories/GHSA-w5hq-g745-h8pq)

## Production hardening still required

- Add gateway rate limits for public Edge Functions.
- Run the Supabase migration and verify Row Level Security in the linked project.
- Rotate any credential immediately if it ever enters Git history.
- Add branch protection, dependency update automation, and a supported private reporting channel.
- Re-run dependency and secret scans in CI on every release.
