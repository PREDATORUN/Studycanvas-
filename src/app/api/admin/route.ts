import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, database } from "@/lib/firebase/admin";
import { authorize, mutation, body, failure, HttpError } from "@/lib/server";
const schema = z
  .object({
    action: z.enum(["resolve", "removeDoubt", "closeSpace", "approveTeacher"]),
    id: z.string().regex(/^[a-zA-Z0-9_-]{1,128}$/),
  })
  .strict();
export async function GET(req: Request) {
  try {
    const user = await authorize(req);
    if (!user.admin) throw new HttpError(403, "Administrator access required.");
    const docs = await database()
      .collection("reports")
      .where("status", "==", "open")
      .limit(50)
      .get();
    return Response.json({
      items: docs.docs.map((d) => ({
        id: d.id,
        targetId: d.data().targetId,
        reason: d.data().reason,
      })),
    });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(req: Request) {
  try {
    const user = await mutation(req);
    if (!user.admin) throw new HttpError(403, "Administrator access required.");
    if (Date.now() / 1000 - user.auth_time > 300)
      throw new HttpError(
        401,
        "Sign in again before an administrative change.",
      );
    const input = schema.parse(await body(req));
    const db = database();
    const audit = await db
      .collection("auditLogs")
      .add({
        actorId: user.uid,
        action: input.action,
        targetId: input.id,
        status: "started",
        createdAt: FieldValue.serverTimestamp(),
      });
    if (input.action === "resolve")
      await db.doc(`reports/${input.id}`).update({ status: "resolved" });
    if (input.action === "removeDoubt")
      await db.recursiveDelete(db.doc(`doubts/${input.id}`));
    if (input.action === "closeSpace")
      await db.doc(`spaces/${input.id}`).update({ closed: true });
    if (input.action === "approveTeacher") {
      const profile = await db.doc(`users/${input.id}`).get();
      if (!profile.exists) throw new HttpError(404, "Account not found.");
      const target = await adminAuth().getUser(input.id);
      await adminAuth().setCustomUserClaims(input.id, {
        ...target.customClaims,
        teacher: true,
      });
      await profile.ref.update({ role: "teacher" });
    }
    await audit.update({
      status: "completed",
      completedAt: FieldValue.serverTimestamp(),
    });
    return Response.json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
