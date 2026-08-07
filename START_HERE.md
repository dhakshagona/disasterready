# DisasterReady: Start Here

This folder is the source-of-truth package for rebuilding DisasterReady as a real mobile application.

## Recommended stack

- React Native with Expo
- TypeScript
- Expo Router
- Local-first storage for preferences, cached alerts, action plans, and checklist progress
- Supabase later for optional accounts, synchronization, device tokens, and backend jobs
- National Weather Service alerts for live U.S. weather alerts
- Verified shelter data only
- Apple Maps / Google Maps deep links for routing

## Build sequence

Do not build the backend first and do not ask an AI agent to build the whole application in one prompt.

1. Scaffold the Expo application and establish quality gates.
2. Build the design system and static navigation using local typed mock data.
3. Implement guest onboarding and local persistence.
4. Add live National Weather Service alert retrieval.
5. Add deterministic, reviewed action-plan templates.
6. Add verified shelter discovery and external map routing.
7. Add optional Supabase authentication and synchronization.
8. Add push notifications using a development build.
9. Add offline behavior, accessibility testing, and failure-state testing.
10. Add a clearly labeled demonstration mode.

## First local setup

Install these before starting:

- Git
- Node.js LTS
- Codex app
- Expo Go on a phone for early UI work, or Android Studio for an Android emulator

Create the app from PowerShell:

```powershell
mkdir DisasterReady
cd DisasterReady
npx create-expo-app@latest . --template default@sdk-57
git init
git add .
git commit -m "chore: scaffold Expo application"
```

Then copy the contents of this starter package into the project root. Keep `AGENTS.md` at the project root.

Open the project folder in the Codex app and submit the task from `docs/PHASE_1_TASK.md`.

## Important checkpoint

Phase 1 is complete only when:

- The app starts without errors.
- Type checking passes.
- Linting passes.
- Tests pass.
- The first static DisasterReady screens render on a phone or emulator.
- Navigation works.
- No backend, authentication, live alerts, or push notifications have been added yet.
