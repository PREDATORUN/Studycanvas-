# Database and access controls

## Implemented paths

| Path                       | Fields                                                                           | Access                                                 |
| -------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------ |
| users/{uid}                | displayName, exam, grade, targetYear, subjects, goal, role, createdAt, updatedAt | Verified owner may read; all writes through server API |
| users/{uid}/tasks/{taskId} | title, completed, createdAt, updatedAt                                           | Verified owner may read; owner-scoped API writes       |
| rateLimits/{uid}           | start (epoch milliseconds), count, expiresAt, updatedAt                          | Server only                                            |

Document IDs use Auth UIDs and Firestore generated IDs. Server timestamps record writes. GET /api/tasks reads the latest 100 by createdAt descending; the dashboard explicitly calculates completion only over that loaded window. Full cursor pagination belongs to the later planner. No composite index is needed for current queries; firestore.indexes.json deliberately contains none.

## Server authorization

GET /api/profile and GET /api/tasks verify the Firebase bearer ID token, including revocation. Writes additionally require verified email. UID always comes from the verified token, never user JSON. Zod objects are strict and reject role injection. Profile transactions assign student to new users and preserve existing trusted roles.

Rules deny all unrelated collection paths, all client writes, and every Storage operation. The Admin SDK bypasses rules, so it must only be called from authenticated owner-scoped services. No teacher or administrator API exists yet. There is no self-service role selector.

## Retention and deletion

No birth date, phone number, school address or public activity is collected. Firebase stores the email for login; it is not copied into public documents. Account deletion requires a login within five minutes and recursively deletes the profile/task tree, the rate-limit record, then the Firebase Auth user. There are no uploaded files in this milestone. Configure TTL for rateLimits.expiresAt. Firestore backups and audit retention require a separate operational policy before launch.

## Later domains (not provisioned, no access granted)

userPreferences, subjects, chapters, questions, questionAttempts, practiceSessions, mockTests, mockTestAttempts, doubts, doubtAnswers, communities, communityMembers, communityPosts, studyRooms, roomParticipants, messages, resources, studyPlans, notifications, teacherClasses, classMembers, assignments, reports and auditLogs will receive query-driven schemas and tests in their milestone. This list does not imply implementation. Child-data consent and guardian workflows need applicable legal review before public launch; compliance is not claimed.

## Milestone 2 additions

`users/{uid}/learning/{recordId}` is server-only (the recursive deny rule still applies). `practice_{questionId}` stores the latest submitted response, explanation, correctness and client-reported time; `bookmark_{questionId}` stores bookmark state; `chapter_{chapterId}` stores guide completion. Generated IDs store mock attempts with version, deadline, responses, review flags, submission state and server-computed results. Reads are owner-scoped through the API, capped at 250 records. This is not full attempt history or scalable cursor pagination. No composite index is required for current bounded queries. Recursive account deletion already removes this subcollection.
Public seed question statements are served from versioned application source; solutions stay server-side until practice submission or mock completion. These are original starter questions, not official PYQs. Test definitions are versioned starter simulations, not official formats. New patterns must retain older versions needed by active attempts.

## Latest shared-data model

See [BUILD_READINESS.md](BUILD_READINESS.md) for spaces/posts, doubt answers/votes, invitations, notifications, planner records, contributions, moderation/audit records and deletion behavior. Updated rules allow verified space members to read their room and posts. All client writes remain denied. Teacher/admin authorization uses trusted Auth custom claims.
