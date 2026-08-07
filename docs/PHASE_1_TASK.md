# Phase 1 Codex Task

You are working in the DisasterReady Expo repository.

Read these files before changing code:

- `AGENTS.md`
- `docs/PRODUCT_SPEC.md`
- `docs/ARCHITECTURE.md`
- `START_HERE.md`

Review the UI references under:

- `reference/disastereadyuiux.mp4`
- `reference/contact-sheet.jpg`
- `reference/frames/`
- `assets/brand/lifebuoy.png`

## Objective

Create the first production-quality frontend foundation and a static, navigable DisasterReady prototype using typed local mock data.

Do not add Supabase, authentication, live APIs, push notifications, maps SDKs, or background jobs in this phase.

## Required work

1. Inspect the current Expo project and report its structure and package versions.
2. Create or refine a maintainable feature-based structure.
3. Enable strict TypeScript.
4. Add practical scripts for:
   - lint
   - typecheck
   - test
5. Create a small design-token system for:
   - colors
   - typography
   - spacing
   - radii
   - shadows
6. Build reusable components:
   - Screen
   - AppHeader
   - PrimaryButton
   - SecondaryButton
   - Card
   - StatusBadge
   - AlertCard
   - ActionStepRow
   - EmptyState
   - OfflineBanner
7. Build typed domain models for:
   - Alert
   - HazardType
   - UserPreferences
   - ActionPlan
   - ActionStep
   - Shelter
8. Add typed mock repositories so screens never import raw mock JSON directly.
9. Implement these navigable screens:
   - Splash
   - Welcome
   - Guest onboarding
   - Hazard selection
   - Permission explanation
   - Accessibility preferences
   - Home with no alerts
   - Home with a demo flood warning
   - Alert details with top three “Do now” actions
   - Action plan checklist
   - Alerts list
   - Settings
10. Include a clearly visible Demo Mode badge anywhere demo data appears.
11. Use the provided lifebuoy asset.
12. Add loading, empty, offline, and error component states where practical.
13. Add basic tests for:
   - alert-card rendering
   - action-step completion behavior
   - demo-versus-real labeling
14. Ensure all interactive controls have accessibility labels and adequate touch targets.
15. Run lint, typecheck, and tests. Fix failures before finishing.

## Visual direction

Preserve the recognizable design language from the reference recording:

- calm pale-blue background
- strong blue primary actions
- red only for danger
- green for safe/completed states
- rounded white cards
- readable typography
- generous spacing
- bottom navigation for Home, Alerts, and Settings

Improve the layout where needed to place immediate actions above secondary content.

## Constraints

- Do not fabricate live behavior.
- Do not label mock data as real.
- Do not generate safety instructions dynamically.
- Use a small reviewed demo checklist stored in typed local code.
- Do not over-engineer state management.
- Do not introduce a backend.
- Do not rewrite unrelated generated Expo files without reason.

## Completion report

At the end, provide:

1. Summary of architecture and files changed
2. Commands run
3. Lint/typecheck/test results
4. How to launch the app
5. Screens implemented
6. Known limitations
7. Recommended Phase 2 task
