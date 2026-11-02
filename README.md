# StudyCanvas

A private learning workspace for JEE and NEET students. **Core learning, community, classroom communication, planner and analytics implementation. Not a public-launch-ready release.**

## What is included

- Next.js App Router, React, strict TypeScript, Tailwind tokens, reusable Radix Slot button, Lucide icons.
- Light/dark themes, desktop sidebar, tablet drawer, mobile bottom navigation, reduced-motion styles.
- Firebase email/password login and registration, Google sign-in, password reset, email verification, persistent Firebase browser sessions, sign-out, account deletion.
- Verified-user onboarding with exam, class, target year, subjects, and learning goal.
- Private Firestore-backed dashboard tasks: add, complete, reopen, reload, and calculate completion from actual saved tasks.
- Server-verified bearer tokens, revoked-token checks, strict request validation, per-user transactional write limits, deny-by-default Firestore/Storage rules.
- Honest setup, loading, error, empty, and future-milestone states. No seeded student metrics.

## Run locally / Codespaces

Requires Node.js 22 or newer.

```bash
npm ci
cp .env.example .env.local
# Fill in Firebase configuration, then restart the dev server.
npm run dev -- --hostname 0.0.0.0
```

Open the forwarded **port 3000** preview in Codespaces. This does not publish the app to the public internet. Without Firebase configuration the landing page, shell, themes, and setup screens work; saving and sign-in remain unavailable.

## Firebase setup

1. Create a Firebase project and register a web app. Copy the browser configuration into the `NEXT_PUBLIC_FIREBASE_*` variables. These values identify your project; they are not privileged server secrets.
2. Enable Email/Password and Google providers under Authentication. Enable email enumeration protection and configure password policy/provider abuse limits. Add the exact preview hostname and eventual deployment hostname to authorized domains. Preview-domain changes require updating this list.
3. Create Firestore in a deliberately chosen region. Obtain a dedicated server service account with only the required Auth management and Firestore access. Put `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY` in `.env.local` or Vercel server environment variables. The private key can use literal `\n` separators. Never commit the key or a service account JSON. Do not paste secrets into issues, source files, or chat.
4. Deploy Firestore/Storage rules and indexes using your own authenticated Firebase CLI: `npx firebase deploy --only firestore:rules,firestore:indexes,storage --project YOUR_PROJECT_ID`. Storage is intentionally denied until uploads are implemented; Storage provisioning may require billing and is not needed for milestone 1.
5. Configure Firestore TTL on `rateLimits.expiresAt` (optional cost/retention cleanup). Limits work without TTL but expired documents otherwise remain until replaced or deleted.
6. Register a test student, verify the email, finish onboarding, add/complete a task, reload, then test sign-out and deletion. Cross-account reads must remain denied.

Do not expose this to real students before privacy/consent operations and production monitoring are reviewed. No legal compliance or official syllabus coverage is claimed.

## Commands

```bash
npm run typecheck
npm run lint
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm run test:rules
npm start
```

Rules tests require Java 21+, an emulator download, and an unused port 8080. E2E tests currently target the **unconfigured Firebase** state; use a clean shell without real Firebase variables. Production Firebase sign-in and persistence require the separate live checklist above.

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Database and access model](docs/DATABASE.md)
- [Feature status / test evidence](docs/FEATURE_STATUS.md)
- [Vercel deployment](docs/DEPLOYMENT.md)

## Next milestones

2. Versioned curriculum, original question bank, practice, mocks, and resources.
3. Doubts, communities, notifications, moderation.
4. Teacher classes, assignments, authorized messaging, real-time text rooms.
5. Full planner, analytics, accessibility/security/performance QA, PWA.

Optional AI and WebRTC services are not implemented. They never block the foundation. No application has been publicly deployed by this change.

## Learning milestone update

See [Milestone 2](docs/MILESTONE_2.md) for original practice, learning guides, resource downloads, versioned mock simulations, test evidence, and remaining scope. Public guest practice works without Firebase; private progress and mock attempts require verified Firebase accounts.

## Latest readiness checkpoint

Read [BUILD_READINESS.md](docs/BUILD_READINESS.md) first for the current feature map, configuration, executed tests and exact remaining master-spec work. Core pages for doubts, communities, rooms, notifications, teacher classes, moderation, planner and analytics are now implemented, with Firebase-connected verification still required.
