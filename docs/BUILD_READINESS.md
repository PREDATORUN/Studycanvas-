# StudyCanvas build readiness — current checkpoint

This is a working-code review checkpoint. It is **not full completion of the master specification or a public-launch-ready release**. No deployed Firebase project or public application is claimed. See the implementation and validation distinctions below.

Liquid Clear Glass UI work is recorded separately in [LIQUID_GLASS.md](LIQUID_GLASS.md). The new shared material adds an appearance page and changes the frontend presentation, with 64 local tests passing. Its browser visual acceptance is still pending; the feature limitations in this readiness document still apply.

## Implemented code

| Area            | Current behavior                                                                                                                                                                     |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Foundation      | Authentication integration, verification, onboarding, responsive shell, theme, private dashboard tasks, profile settings                                                             |
| Learning        | Six original guides, twelve original questions, guest grading, private latest attempts/bookmarks/completion, three starter mock simulations, saved results, original guide downloads |
| Doubt Hub       | Verified-account doubts, answers, helpful votes with one vote per UID/answer, author-only accepted answers, subject labels, search over loaded doubts, reporting                     |
| Communities     | Public/invitation-only spaces, capped membership, explicit invitation acceptance, owner announcements, joining/leaving/closing                                                       |
| Study rooms     | Member-only real-time text posts and shared notes through Firestore subscriptions; last saved notes win                                                                              |
| Messages        | Group conversations within joined spaces; no unsolicited direct messages                                                                                                             |
| Notifications   | Private reply and invitation notifications, read state                                                                                                                               |
| Teacher access  | Private classroom spaces; class creation requires trusted teacher/admin Auth claims; owners can invite members and announce                                                          |
| Administration  | Trusted admin claims required; report queue, report resolution, doubt removal, space closure, teacher approval, audit trail, recent login for mutations                              |
| Planner         | Date-based sessions/tasks/breaks with planned minutes, completion and removal                                                                                                        |
| Analytics       | Actual latest practice accuracy/count/time, guide completion count, stored mock scores, subject accuracy bars; formulas and read limits disclosed                                    |
| PWA preparation | App manifest and SVG icon; no service worker or offline private-data cache                                                                                                           |
| Deletion        | Auth token revocation, contribution cleanup, membership removal, owned-space closure, last-authored note removal, private-tree cleanup, reporter ID anonymization, Auth deletion     |

## Configuration required before use

Follow README Firebase setup. Deploy the **updated** Firestore rules before using live messages: verified members may read their spaces and posts, all client writes remain denied. All mutations pass through owner/member/role-scoped server APIs.

A trusted operator bootstraps the first administrator using `node scripts/grant-role.mjs UID admin --confirm` with server credentials in `.env.local`. Never expose this as a public endpoint. The administrator can grant teacher access from `/admin`. Users must sign in again to refresh custom claims. Browser-supplied role/profile fields do not grant elevated access.

No Firebase credentials were supplied in this session. Live Auth, private data persistence, invitation acceptance, concurrent votes, real-time subscriptions, account deletion, teacher/admin actions and security rules have **not** passed live acceptance testing. The emulator needs Java 21+, which is unavailable locally; rules tests are provided for configured CI.

## Validation actually executed

- TypeScript: pass.
- ESLint: pass without warnings after fixes.
- Vitest: **54 tests across six files pass**. These include scoring, validation, server-control-flow checks, actual guest learning routes, space policy cases and mocked social/admin authorization routes. Mocked route tests do not establish live Firebase behavior.
- Next.js production build: pass, including all new routes.
- Browser/visual QA: unverified for this checkpoint. The preview daemon stops and the cloud browser connection was refused in prior attempts. No continuous preview availability is promised.
- Existing six moderate transitive production dependency advisories remain unresolved. The earlier compatible grpc-js override removes the high-severity advisory; no vulnerability-free release is claimed.
- The operator role script is formatted but **was not run** against any account.

## Exact remaining master-spec work

- Official-source verification and full curriculum, a larger reviewed bank, KaTeX/diagrams and rich question rendering, custom/teacher tests and richer Advanced marking, immutable practice history/pagination, full dashboard integration and chapter-level analytics.
- Resource file uploads, MIME/size validation, Storage permissions, PDF preview, teacher publishing, bookmarks/reporting and moderation of uploaded files. Current resource library contains only original downloadable text guides.
- Doubt image attachments, comments, discussion bookmarks, unanswered filters, verified-teacher answer badges, group search pagination, moderator assignment, invitation decline/revocation, join requests, blocking and content appeal workflows.
- Teacher assignments/submissions, student-specific authorized educational records, teacher aggregate analytics and secure roster management. Current teacher workspace is a classroom communication foundation.
- Room invitations via share links, participant-name roster, synchronized study timers, end-to-end chat fallback when Firestore is unavailable, whiteboard, WebRTC voice/video/screen sharing, signaling/TURN/STUN integration. Current rooms support text and shared notes only.
- Full calendar/weekly planner, recurring tasks, deadlines/notifications, tracked study sessions, activity/streak charts, revision backlog, test trends and deeper recommendations.
- Full role/user-management UI, abuse suspension, action rollback/appeals, atomic cross-service role/deletion operations and robust large-account cleanup jobs. Current deletion is retriable after signing in again if part of cleanup fails; it is not atomic.
- Provider-agnostic AI integration, configured provider/quotas/secret management and tutoring UI. No AI output is fabricated; AI is not implemented.
- Complete installable/offline PWA, notification push/email, comprehensive mobile/tablet/browser/keyboard/accessibility QA, formal performance and load checks, full Firebase emulator/integration test suite, privacy/guardian/consent operations and separate applicable legal review.
- Dependency remediation, production Firebase configuration, authorization/isolation verification and Vercel deployment verification before public launch.

## Data and retention notes

Shared collections: `doubts/{id}/answers/{id}/votes/{uid}`, `spaces/{id}/posts/{id}`, `reports`, `auditLogs`. Private subcollections: `users/{uid}/notifications`, `invitations`, `contributions` and `planner`, alongside existing tasks/learning records. Queries are intentionally bounded (40 spaces/doubts, 50 messages/notifications/reports, 60 answers, 100 planner tasks, 250 learning records). Full cursor pagination is remaining work. Single-field indexes suffice for current queries.

Contributions hold server-generated document paths for account cleanup. Client access to these paths is denied. Deleting a doubt also deletes dependent answers, including answers by other users; contributor records pointing to removed content are harmless and cleared during later cleanup. Shared safety reports retain their protected reason text for moderation while reporter IDs are anonymized. Audit actor/target IDs remain for operational accountability; finalize a retention policy before public launch. Shared content created before the contribution registry exists needs a migration if such data is later imported.
