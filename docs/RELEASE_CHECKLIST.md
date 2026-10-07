# DisasterReady release checklist

Record the release commit and evidence links. Do not mark an item complete from expectation alone.

## Locked product direction

- [ ] The iPhone-first 390x844 design remains unchanged except for verified bug fixes.
- [ ] Colors, typography, lifebuoy branding, emergency actions, and bottom navigation match the approved direction.
- [ ] Demo content is clearly simulated and real shelter routes use only verified open destinations.
- [ ] The repository punctuation check reports zero prohibited Unicode characters.

## Repository verification

- [ ] `npm ci` succeeds from a clean checkout.
- [ ] `npm run verify:release` passes on the release commit.
- [ ] Supabase CLI reports version 2.113.0.
- [ ] `npx supabase db reset` succeeds in a Docker-enabled local environment.
- [ ] All three Edge Functions bundle and run locally or deploy successfully to a staging project.
- [ ] `npm audit --omit=dev --audit-level=high` is reviewed against `SECURITY.md`.

## Supabase and AI

- [ ] The complete migration ledger is applied with `npx supabase db push`.
- [ ] Publishable and secret key handling is verified with modern hosted keys.
- [ ] Direct client access to analytics tables and views is denied.
- [ ] Per-client and global rate limits are exercised in staging.
- [ ] `RATE_LIMIT_SALT` is unique and stored only as a project secret.
- [ ] The Gemini key is stored only as a Supabase project secret.
- [ ] The Gemini project remains on the free tier with paid billing disabled.
- [ ] Gemini unpaid-service terms, including product-improvement use and possible human review of inputs and outputs, are explicitly approved.
- [ ] `npm run verify:backend -- --include-ai` passes.
- [ ] Batched 90-day analytics retention and rate-limit cleanup calls are scheduled and observed until they reach zero rows.

## Web deployment

- [ ] The exact release commit is deployed.
- [ ] The production build command is `npm run build:web` and the output directory is `dist`.
- [ ] Only the two public Supabase client variables are present in the web host.
- [ ] Direct loads of Home demo, Alerts, Shelters, Settings, Alert Detail, Safety Route, and Checklist succeed.
- [ ] Browser console and network logs contain no new application errors.
- [ ] The public URL is added to `README.md`.

## Device and user evidence

- [ ] VoiceOver, Dynamic Type, reduced motion, contrast, focus order, and safe-area behavior are checked on an iPhone.
- [ ] TalkBack and responsive layout are checked on an Android device where practical.
- [ ] User-test participants have consented and no sensitive emergency data is recorded.
- [ ] Findings are recorded as observations, not invented outcomes.
- [ ] Critical safety-comprehension or accessibility findings are fixed or declared release blockers.

## GitHub approval

- [ ] README, architecture, deployment, security, AI safety, analytics, and user-testing documents match the release.
- [ ] No secrets, local environment files, generated builds, or unrelated artifacts are tracked.
- [ ] Branch protection, dependency updates, and private security reporting are configured.
- [ ] The final release commit and deployment are approved by the repository owner.
