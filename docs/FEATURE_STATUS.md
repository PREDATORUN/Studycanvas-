# Feature status

## Implementation scope

Milestone 1 code is implemented. Final acceptance depends on test evidence below and Firebase-connected verification. Milestones 2–5 have not started.

### Implemented; local verification below

- Public landing page; responsive shell; all navigation destinations; theme toggle; reduced motion and keyboard focus styles.
- Auth forms: email/password registration and login, Google sign-in, reset email, verification, logout, Firebase persistent browser session.
- Verification gate and onboarding; private dashboard; add/complete/reopen tasks; actual loaded-task completion calculation.
- Account deletion with recent-login check; owner-scoped APIs; schema validation; shared write rate limit.
- Security rules, server-only Admin integration, CI configuration, docs.

### External configuration and manual verification required

Real Firebase Auth providers, authorized domains, email delivery, credentials, Firestore persistence, token revocation, Google popup flow, account deletion and cross-account server API isolation. No successful live result is claimed.

### Partial / deliberate limits

- Dashboard shows only real task counts. Practice, streak, tests and activity panels disclose their unavailability.
- All future menu destinations have labeled unavailable screens, not functional modules.
- Task list is capped at the latest 100. It is a foundation daily list, not the full calendar planner.
- Auth gates protect UI; actual data authorization lives in API handlers and database rules.
- Teacher/admin roles are represented by the profile type and cannot be self-assigned; dedicated interfaces and approval are not implemented.
- Preferred subjects are configurable during onboarding and profile edits. Optional avatar upload remains unimplemented.

### Not implemented

Full syllabus, chapters, question bank, practice/mock engines, resources/uploads, doubt/community systems, teacher classes, messaging, notifications, real-time text rooms, WebRTC, AI, analytics, full planner/recurrence, installable PWA, guardian consent, appeal/moderation operations. These remain in their specified milestones.

## Test evidence

Executed locally on 2 November 2026:

| Check                                           | Result                                                                                                                                       |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| TypeScript (`npm run typecheck`)                | PASS, including a clean run with generated .next files temporarily absent                                                                    |
| ESLint (`npm run lint`)                         | PASS, no warnings                                                                                                                            |
| Vitest (`npm test`)                             | PASS: 17 tests across schema validation and mocked server authorization                                                                      |
| Production build (`npm run build`)              | PASS: Next.js 16.4.4                                                                                                                         |
| HTTP smoke checks                               | PASS: /, /dashboard, /login?mode=register, /onboarding, /settings, /api/health, unconfigured profile/tasks APIs, and 404 handling (9 checks) |
| Playwright (`npm run test:e2e`)                 | 3 API-only checks passed; 6 browser checks failed before execution because Chromium is absent                                                |
| Browser installation                            | BLOCKED: download returned invalid/truncated ZIP files                                                                                       |
| Firestore rules emulator (`npm run test:rules`) | BLOCKED before tests: local Java 17; firebase-tools requires Java 21+                                                                        |
| Production dependency audit                     | No high/critical advisories at audit time; 6 moderate transitive advisories remain                                                           |
| Git diff whitespace                             | PASS                                                                                                                                         |

The grpc-js override pins the compatible patched 1.x range to remove the high-severity transitive Firebase advisory. The remaining moderate glob/minimatch chain must be reviewed and remediated before public launch; a blanket major-version override was not applied without compatibility evidence. The attempted nonbreaking audit auto-fix did not finish and was stopped. No vulnerability-free release is claimed.

Authorization tests mock Firebase Admin and transaction responses. They verify server control flow, token-revocation checks, student role defaults, strict role-injection rejection, verified-email enforcement, same-origin enforcement, and write limits. They do **not** verify actual Firebase credentials or deployed rules.

UI responsiveness and themes are implemented but lack successful browser/visual QA in this environment. Live registration, Google login, email delivery, onboarding/persistence, deletion, cross-account server isolation, and security-rule acceptance remain unverified until Firebase and the emulator/browser prerequisites are available. CI is configured but its remote results are not yet claimed. Milestone 1 is therefore **implemented for review, not fully accepted**. Milestones 2–5 remain unstarted.
