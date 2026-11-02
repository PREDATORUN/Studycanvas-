# Deployment preparation

1. Run `npm ci`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, and browser/rules checks.
2. Configure Firebase and deploy deny-by-default rules as described in README.
3. Import this repository into Vercel using Next.js, Node.js 22, build `npm run build`, default output directory. Use a preview deployment first.
4. Add the six browser configuration variables and three server-only Admin variables from .env.example to the intended environment. Browser configuration is compiled at build time; redeploy after changing it. Store the private key only as a server secret.
5. Add the exact deployment hostname to Firebase Auth authorized domains. Set production Auth email action URLs. Confirm project IDs match between browser and Admin configuration.
6. GET `/api/health` should report status ok and firebaseConfigured true. This only detects presence of configuration; it does **not** verify credentials or external services.
7. Test registration, email verification, password reset, Google sign-in, onboarding, task persistence across reload, second-account isolation, sign-out, recent-login account deletion, dark mode, mobile/tablet layout, keyboard navigation, and revoked-session errors against the preview.
8. Review privacy/consent and moderation operations, platform rate limits, secrets, dependency advisories, Firebase billing/quotas and monitoring before allowing real students. No legal compliance is claimed.

No deployment is created automatically. Storage uploads, AI, WebRTC, PWA, teacher/admin operations and the later learning/community domains are not part of this foundation release. Firebase web config is public; Admin credentials and AI keys must never be exposed through NEXT_PUBLIC_ variables or git.
