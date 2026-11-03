import { loadEnvConfig } from "@next/env";
import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
loadEnvConfig(process.cwd());
const [uid, role, confirmation] = process.argv.slice(2);
if (
  !uid ||
  !["teacher", "admin"].includes(role) ||
  confirmation !== "--confirm"
)
  throw new Error(
    "Usage: node scripts/grant-role.mjs UID teacher|admin --confirm. Run only as the trusted project operator.",
  );
const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  }),
});
const auth = getAuth(app);
const user = await auth.getUser(uid);
await auth.setCustomUserClaims(uid, { ...user.customClaims, [role]: true });
console.log(
  "Role granted. The account must sign in again to refresh its token.",
);
