# Feature status

## Implementation scope

Milestone 1 code is implemented. Final acceptance depends on test evidence below and Firebase-connected verification. Milestones 2–5 have not started.

### Implemented, verification in progress

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

Pending commands. This section is updated after actual execution; test files alone do not establish passing results.
