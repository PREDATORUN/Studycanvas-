import { NextResponse } from "next/server";
import { adminAuth, database } from "@/lib/firebase/admin";
import { mutation, failure, HttpError } from "@/lib/server";
export const runtime = "nodejs";
export async function DELETE(req: Request) {
  try {
    const user = await mutation(req);
    if (Date.now() / 1000 - user.auth_time > 300)
      throw new HttpError(
        401,
        "Sign out and sign in again before deleting your account.",
      );
    await database().recursiveDelete(database().doc(`users/${user.uid}`));
    await database().doc(`rateLimits/${user.uid}`).delete();
    await adminAuth().deleteUser(user.uid);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
