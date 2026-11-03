# Milestone 2 — learning core checkpoint

## Implemented

- Public JEE/NEET starter tracks, Class 11/12 filters, six original chapter guides, topics and learning objectives. No claim of complete or officially verified syllabus coverage.
- Twelve original practice questions: single correct, multiple correct, numerical tolerance, integer and matching represented as an ordered-list MCQ. Chapter/difficulty filters, mixed practice, answer explanations and guest grading.
- Verified-account latest question attempts, incorrect retry and bookmark filters, and chapter-completion updates via authenticated server routes. Guest attempts explicitly remain unsaved. Private saved filters currently refresh on page reload.
- Three versioned six-question, ten-minute starter mock simulations: Main-inspired, Advanced-inspired and NEET-inspired. Configurable definitions in bank.ts, server-owned start time/deadline, saved responses and review marks, 15-second autosave, clear response, question palette, manual submission, expiry submission using previously saved answers, server-side scoring and idempotent submitted attempts.
- Saved test results, score, correct/incorrect/skipped counts, attempted accuracy, time, subject breakdown, per-question review and a simple recommendation to revisit mistakes. No invented rank or percentile.
- Searchable original resource guides, subject filters, expandable preview and text downloads. Guides use CC BY 4.0 attribution; no textbook/coaching scans.

## Verification

Local TypeScript, ESLint, scoring/API test and production-build results are recorded at the end of this checkpoint. Tests cover exact/multiple/numerical/integer grading, skips, negative marking, canonical answers, answer-key redaction, expiry freezing, foreign question-ID exclusion, guest persistence disclosure, invalid payload rejection and missing Firebase configuration.

Private mock saving, bookmarks, chapter completion and cross-account isolation are implemented but require live Firebase verification. Browser preview verification remains blocked: the cloud browser times out and the preview's Next.js process reports uv_resident_set_memory errors. The practice UI initially failed to load its bank there; no successful browser-practice claim is made. Direct route tests exercise real guest handler code without external Firebase.

## Remaining in milestone 2

- Complete official-source-verified curriculum; larger reviewed question bank, diagrams and KaTeX formatting.
- Custom chapter tests and teacher-authored tests, richer examination-specific scoring and independently reviewed official patterns.
- Full immutable practice history, revision scheduling, configurable timed practice and query pagination. Current account storage intentionally retains only the latest practice result per question and reads at most 250 learning records.
- Chapter-level result aggregation, detailed recommendations and dashboard analytics integration.
- Secure resource uploads, PDF preview, publishing/moderation, resource bookmarks and reporting. These are not represented by fake upload controls.
- Successful end-to-end tests of authenticated private flows and browser-responsive QA.

Milestone 2 is a core implementation checkpoint, not full milestone acceptance. Milestones 3–5 (community, teaching/collaboration, planner/analytics/PWA/final hardening) remain unimplemented. Firebase credentials, providers and domains, Java 21/rules tests and dependency advisory remediation remain outstanding from the foundation checkpoint. No public deployment has been made.

## Final local check results

TypeScript: PASS. ESLint: PASS with no warnings. Vitest: 36 tests pass across four files. Next.js production build: PASS. Live Firebase tests and browser UI tests: not verified for this checkpoint.
