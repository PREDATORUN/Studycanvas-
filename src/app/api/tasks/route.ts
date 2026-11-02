import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { database } from "@/lib/firebase/admin";
import { authorize, mutation, body, failure, HttpError } from "@/lib/server";
import { taskSchema, taskUpdateSchema } from "@/lib/schemas";
export const runtime = "nodejs";
export async function GET(req: Request) {
  try {
    const user = await authorize(req);
    const docs = await database()
      .collection(`users/${user.uid}/tasks`)
      .orderBy("createdAt", "desc")
      .limit(100)
      .get();
    return NextResponse.json({
      tasks: docs.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate().toISOString() ?? "",
      })),
    });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(req: Request) {
  try {
    const user = await mutation(req);
    const data = taskSchema.parse(await body(req));
    const ref = await database()
      .collection(`users/${user.uid}/tasks`)
      .add({
        ...data,
        completed: false,
        createdAt: FieldValue.serverTimestamp(),
      });
    return NextResponse.json({ id: ref.id }, { status: 201 });
  } catch (e) {
    return failure(e);
  }
}
export async function PATCH(req: Request) {
  try {
    const user = await mutation(req);
    const { id, completed } = taskUpdateSchema.parse(await body(req));
    const ref = database().doc(`users/${user.uid}/tasks/${id}`);
    await database().runTransaction(async (tx) => {
      if (!(await tx.get(ref)).exists)
        throw new HttpError(404, "Task not found.");
      tx.update(ref, { completed, updatedAt: FieldValue.serverTimestamp() });
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
