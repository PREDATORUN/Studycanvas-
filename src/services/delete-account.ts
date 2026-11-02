import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, database } from "@/lib/firebase/admin";
export async function deleteAccount(uid: string) {
  const db = database();
  await adminAuth().revokeRefreshTokens(uid);
  const base = db.collection(`users/${uid}/contributions`);
  for (;;) {
    const page = await base.limit(100).get();
    if (page.empty) break;
    for (const item of page.docs) {
      const path = item.data().path;
      if (typeof path === "string") await db.recursiveDelete(db.doc(path));
      await item.ref.delete();
    }
  }
  const spaces = await db
    .collection("spaces")
    .where("memberIds", "array-contains", uid)
    .get();
  for (const space of spaces.docs) {
    const data = space.data();
    await space.ref.update({
      memberIds: FieldValue.arrayRemove(uid),
      ...(data.ownerId === uid ? { ownerId: "", closed: true, notes: "" } : {}),
    });
  }
  const noteSpaces = await db
    .collection("spaces")
    .where("notesAuthorId", "==", uid)
    .get();
  for (const space of noteSpaces.docs)
    await space.ref.update({ notes: "", notesAuthorId: "" });
  const reports = await db
    .collection("reports")
    .where("reporterId", "==", uid)
    .get();
  for (const report of reports.docs)
    await report.ref.update({ reporterId: "deleted" });
  await db.recursiveDelete(db.doc(`users/${uid}`));
  await db.doc(`rateLimits/${uid}`).delete();
  await adminAuth().deleteUser(uid);
}
