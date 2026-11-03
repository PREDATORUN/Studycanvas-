# Architecture

## Milestone plan and stopping point

This change stops at the foundation milestone. The shell includes all proposed destinations, but future destinations explicitly show their milestone and unavailable state. Milestone 1 cannot receive final acceptance until live Firebase flows are verified.

## Boundaries

Next.js renders public pages and the shell. Small client components own browser authentication, theme selection, onboarding and dashboard interactions. Firebase Auth persists its browser session and refreshes ID tokens. Every private API verifies a fresh bearer token using Firebase Admin with revoked-token checking; no unsigned cookie or client role grants server access. No custom session cookies are used, so no cookie-authenticated mutation surface is introduced.

Public route HTML contains no private data. Gate provides a presentation boundary; private data protection comes from the API and Firestore rules, not from the Gate. Server responses are not cached. Firebase Admin is imported only through server-only modules. The first initialization is lazy, allowing unconfigured production builds.

Client → authenticated server API → Admin SDK → Firestore. User profile and task writes require verified email, strict Zod parsing, same-origin checks when an Origin header is present, and a shared Firestore write budget of 30 operations per UID per minute. The budget is not a global DDoS defense; configure platform and Firebase provider limits before launch.

## Decisions

- Use API-based writes throughout this milestone, with database client writes denied. Future real-time room reads can be added deliberately with membership rules.
- Keep task storage under the owner profile so account deletion can recursively remove it.
- Role defaults to student inside the trusted profile transaction. Client role input is rejected. Existing roles are preserved by profile edits; privileged role management is deferred.
- Fetch profile and tasks concurrently; unsubscribe from Auth state on unmount and ignore stale fetch completions.
- Use a system font stack without downloading third-party fonts; avoid chart/motion dependencies until they serve implemented features. CSS transitions respect reduced motion.
- Simple native forms plus shared Zod validation for the small foundation. React Hook Form, Query, KaTeX, charts, and additional shadcn primitives can be introduced with the relevant domains.
- No offline caching of private records. PWA implementation is deferred to milestone 5.

## Risks and operational gates

Auth data and Firestore deletion are separate operations, not atomic. Deletion removes Firestore data before Auth; retries are possible if the Auth step fails. Auth-to-Firestore creation is lazy; a registered user can return to onboarding after verification.

Only milestones 1 data exists, so deletion currently covers users/{uid}, tasks, rate limits, and Auth. Every new domain must extend the retention/deletion service before accepting data. Production logging/alerts, CAPTCHA/App Check, guardian/consent workflows where required, appeals, formal accessibility audit, and load testing remain launch gates. No sensitive request payloads are logged by application code.

Use official Next.js and Firebase docs for API updates: https://nextjs.org/docs and https://firebase.google.com/docs/auth/admin/manage-sessions.

## Dependency review

Production audit currently retains six moderate transitive glob/minimatch advisories. A compatible grpc-js 1.x override removes the high-severity transitive advisory; recheck upstream package compatibility before removing it. See FEATURE_STATUS.md for actual execution evidence.
