import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { database } from "@/lib/firebase/admin";
import { authorize, mutation, body, failure } from "@/lib/server";
import { profileSchema } from "@/lib/schemas";
export const runtime = "nodejs";
export async function GET(req: Request) {
  try {
    const user = await authorize(req);
    const doc = await database().doc(`users/${user.uid}`).get();
    return NextResponse.json({ profile: doc.exists ? doc.data() : null });
  } catch (e) {
    return failure(e);
  }
}
export async function PUT(req: Request) {
  try {
    const user = await mutation(req);
    const data = profileSchema.parse(await body(req));
    const ref = database().doc(`users/${user.uid}`);
    await database().runTransaction(async (tx) => {
      const doc = await tx.get(ref);
      tx.set(
        ref,
        {
          ...data,
          role: doc.data()?.role ?? "student",
          updatedAt: FieldValue.serverTimestamp(),
          ...(!doc.exists ? { createdAt: FieldValue.serverTimestamp() } : {}),
        },
        { merge: true },
      );
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
