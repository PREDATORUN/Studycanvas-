import { readFileSync } from "node:fs";
import { beforeAll, afterAll, it } from "vitest";
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc } from "firebase/firestore";
let env: RulesTestEnvironment;
beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-studycanvas",
    firestore: {
      host: "127.0.0.1",
      port: 8080,
      rules: readFileSync("firestore.rules", "utf8"),
    },
  });
  await env.withSecurityRulesDisabled(async (c) => {
    await setDoc(doc(c.firestore(), "users/alice"), { role: "student" });
    await setDoc(doc(c.firestore(), "spaces/group"), { memberIds: ["alice"] });
    await setDoc(doc(c.firestore(), "spaces/group/posts/post"), {
      text: "Private message",
    });
  });
});
afterAll(async () => {
  await env?.cleanup();
});
it("denies anonymous profile access", async () => {
  await assertFails(
    getDoc(doc(env.unauthenticatedContext().firestore(), "users/alice")),
  );
});
it("allows verified owner only", async () => {
  await assertSucceeds(
    getDoc(
      doc(
        env.authenticatedContext("alice", { email_verified: true }).firestore(),
        "users/alice",
      ),
    ),
  );
  await assertFails(
    getDoc(
      doc(
        env.authenticatedContext("bob", { email_verified: true }).firestore(),
        "users/alice",
      ),
    ),
  );
});
it("denies role changes even for owner", async () => {
  await assertFails(
    setDoc(
      doc(
        env.authenticatedContext("alice", { email_verified: true }).firestore(),
        "users/alice",
      ),
      { role: "admin" },
    ),
  );
});
it("denies unverified owner", async () => {
  await assertFails(
    getDoc(
      doc(
        env
          .authenticatedContext("alice", { email_verified: false })
          .firestore(),
        "users/alice",
      ),
    ),
  );
});

it("limits room message reads to verified members", async () => {
  const owner = env
    .authenticatedContext("alice", { email_verified: true })
    .firestore();
  const outsider = env
    .authenticatedContext("bob", { email_verified: true })
    .firestore();
  await assertSucceeds(getDoc(doc(owner, "spaces/group/posts/post")));
  await assertFails(getDoc(doc(outsider, "spaces/group/posts/post")));
  await assertFails(
    setDoc(doc(owner, "spaces/group/posts/post"), { text: "Client bypass" }),
  );
});
