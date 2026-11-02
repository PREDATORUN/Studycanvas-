import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { database } from "@/lib/firebase/admin";
import { authorize, mutation, body, failure } from "@/lib/server";
const id = z.string().regex(/^[a-zA-Z0-9_-]{1,128}$/);
const schema = z.discriminatedUnion("action", [
  z
    .object({
      action: z.literal("create"),
      title: z.string().trim().min(1).max(160),
      date: z.iso.date(),
      subject: z.enum([
        "Physics",
        "Chemistry",
        "Mathematics",
        "Biology",
        "Break",
        "Other",
      ]),
      minutes: z.number().int().min(5).max(180),
    })
    .strict(),
  z
    .object({ action: z.literal("complete"), id, completed: z.boolean() })
    .strict(),
  z.object({ action: z.literal("remove"), id }).strict(),
]);
export async function GET(req: Request) {
  try {
    const user = await authorize(req);
    const docs = await database()
      .collection(`users/${user.uid}/planner`)
      .orderBy("date", "asc")
      .limit(100)
      .get();
    return Response.json({
      items: docs.docs.map((d) => ({ id: d.id, ...d.data() })),
    });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(req: Request) {
  try {
    const user = await mutation(req);
    const input = schema.parse(await body(req));
    const base = database().collection(`users/${user.uid}/planner`);
    if (input.action === "create") {
      await base.add({
        title: input.title,
        date: input.date,
        subject: input.subject,
        minutes: input.minutes,
        completed: false,
        createdAt: FieldValue.serverTimestamp(),
      });
    } else if (input.action === "complete") {
      await base.doc(input.id).update({ completed: input.completed });
    } else {
      await base.doc(input.id).delete();
    }
    return Response.json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
