import "server-only";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { adminAuth, adminConfigured, database } from "@/lib/firebase/admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function authorize(request: Request) {
  if (!adminConfigured())
    throw new HttpError(503, "Firebase setup is required.");
  const token = request.headers
    .get("authorization")
    ?.match(/^Bearer (.+)$/)?.[1];
  if (!token) throw new HttpError(401, "Please sign in.");
  let user;
  try {
    user = await adminAuth().verifyIdToken(token, true);
  } catch {
    throw new HttpError(401, "Your session expired. Please sign in again.");
  }
  return user;
}
export async function mutation(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    throw new HttpError(403, "Cross-origin requests are not allowed.");
  if (Number(request.headers.get("content-length") ?? 0) > 10000)
    throw new HttpError(413, "Request too large.");
  const user = await authorize(request);
  if (!user.email_verified)
    throw new HttpError(403, "Verify your email before saving changes.");
  // Shared Firestore transaction, effective across serverless instances.
  const ref = database().doc(`rateLimits/${user.uid}`);
  await database().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const old = snap.data();
    const now = Date.now();
    const reset = !old || now - old.start > 60000;
    const count = reset ? 1 : old.count + 1;
    if (count > 30)
      throw new HttpError(429, "Too many changes. Try again in a minute.");
    tx.set(ref, {
      start: reset ? now : old.start,
      count,
      expiresAt: Timestamp.fromMillis(now + 120000),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
  return user;
}
export async function body(request: Request) {
  const text = await request.text();
  if (text.length > 10000) throw new HttpError(413, "Request too large.");
  try {
    return JSON.parse(text);
  } catch {
    throw new HttpError(400, "Invalid JSON.");
  }
}
export function failure(error: unknown) {
  if (error instanceof HttpError)
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  if (error instanceof ZodError)
    return NextResponse.json(
      { error: "Check your form values." },
      { status: 400 },
    );
  return NextResponse.json(
    { error: "The operation could not be completed. Please try again." },
    { status: 500 },
  );
}
