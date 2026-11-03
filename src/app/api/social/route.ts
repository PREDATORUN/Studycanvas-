import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { authorize, mutation, body, failure, HttpError } from "@/lib/server";
import { database } from "@/lib/firebase/admin";
import {
  canJoin,
  canPublish,
  isMember,
  type SpacePolicy,
} from "@/features/social/policy";
export const runtime = "nodejs";
const id = z.string().regex(/^[a-zA-Z0-9_-]{1,128}$/);
const text = z.string().trim().min(2).max(3000);
const schema = z.discriminatedUnion("action", [
  z
    .object({
      action: z.literal("doubt"),
      title: z.string().trim().min(5).max(160),
      text,
      subject: z.enum(["Physics", "Chemistry", "Mathematics", "Biology"]),
    })
    .strict(),
  z.object({ action: z.literal("answer"), id, text }).strict(),
  z.object({ action: z.literal("accept"), id, answerId: id }).strict(),
  z.object({ action: z.literal("vote"), id, answerId: id }).strict(),
  z.object({ action: z.literal("report"), id, reason: text }).strict(),
  z
    .object({
      action: z.literal("space"),
      title: z.string().trim().min(3).max(80),
      description: text,
      kind: z.enum(["community", "room", "class"]),
      private: z.boolean(),
    })
    .strict(),
  z.object({ action: z.literal("join"), id }).strict(),
  z.object({ action: z.literal("leave"), id }).strict(),
  z.object({ action: z.literal("close"), id }).strict(),
  z.object({ action: z.literal("invite"), id, uid: id }).strict(),
  z
    .object({ action: z.literal("post"), id, text, announcement: z.boolean() })
    .strict(),
  z
    .object({ action: z.literal("notes"), id, text: z.string().max(3000) })
    .strict(),
  z.object({ action: z.literal("read"), id }).strict(),
]);
export async function GET(req: Request) {
  try {
    const user = await authorize(req);
    if (!user.email_verified) throw new HttpError(403, "Verify your email.");
    const params = new URL(req.url).searchParams;
    const kind = params.get("kind");
    const db = database();
    if (kind === "doubts") {
      const docs = await db
        .collection("doubts")
        .orderBy("createdAt", "desc")
        .limit(40)
        .get();
      return Response.json({
        items: docs.docs.map((d) => {
          const v = d.data()!;
          return {
            id: d.id,
            title: v.title,
            text: v.text,
            subject: v.subject,
            name: v.name,
            acceptedId: v.acceptedId ?? null,
            canAccept: v.authorId === user.uid,
          };
        }),
      });
    }
    if (kind === "answers") {
      const parent = id.parse(params.get("id"));
      const docs = await db
        .collection(`doubts/${parent}/answers`)
        .orderBy("createdAt", "asc")
        .limit(60)
        .get();
      return Response.json({
        items: docs.docs.map((d) => {
          const v = d.data()!;
          return { id: d.id, text: v.text, name: v.name, votes: v.votes ?? 0 };
        }),
      });
    }
    if (kind === "notifications") {
      const docs = await db
        .collection(`users/${user.uid}/notifications`)
        .orderBy("createdAt", "desc")
        .limit(50)
        .get();
      return Response.json({
        items: docs.docs.map((d) => ({ id: d.id, ...d.data() })),
      });
    }
    if (kind === "spaces") {
      const [publics, mine] = await Promise.all([
        db.collection("spaces").where("private", "==", false).limit(40).get(),
        db
          .collection("spaces")
          .where("memberIds", "array-contains", user.uid)
          .limit(40)
          .get(),
      ]);
      const invitations = await db
        .collection(`users/${user.uid}/invitations`)
        .limit(40)
        .get();
      const invitedIds = new Set(invitations.docs.map((d) => d.id));
      const invited = await Promise.all(
        [...invitedIds].map((id) => db.doc(`spaces/${id}`).get()),
      );
      const docs = new Map(
        [...publics.docs, ...mine.docs, ...invited.filter((d) => d.exists)].map(
          (d) => [d.id, d],
        ),
      );
      return Response.json({
        items: [...docs.values()].map((d) => {
          const v = d.data()!;
          return {
            id: d.id,
            title: v.title,
            description: v.description,
            kind: v.kind,
            private: v.private,
            closed: v.closed,
            count: v.memberIds.length,
            invited: invitedIds.has(d.id),
            member: isMember(v as SpacePolicy, user.uid),
            owner: v.ownerId === user.uid,
            notes: isMember(v as SpacePolicy, user.uid) ? v.notes : "",
          };
        }),
      });
    }
    throw new HttpError(400, "Unknown query.");
  } catch (e) {
    return failure(e);
  }
}
export async function POST(req: Request) {
  try {
    const user = await mutation(req);
    const input = schema.parse(await body(req));
    const db = database();
    const profile = (await db.doc(`users/${user.uid}`).get()).data();
    const name = profile?.displayName ?? "Student";
    const createdAt = FieldValue.serverTimestamp();
    if (input.action === "doubt") {
      const ref = db.collection("doubts").doc();
      const batch = db.batch();
      batch.set(ref, {
        title: input.title,
        text: input.text,
        subject: input.subject,
        authorId: user.uid,
        name,
        createdAt,
        acceptedId: null,
      });
      batch.set(db.doc(`users/${user.uid}/contributions/${ref.id}`), {
        path: ref.path,
      });
      await batch.commit();
      return Response.json({ id: ref.id });
    }
    if (input.action === "report") {
      await db.collection("reports").add({
        targetId: input.id,
        reason: input.reason,
        reporterId: user.uid,
        status: "open",
        createdAt,
      });
      return Response.json({ ok: true });
    }
    if (input.action === "read") {
      const ref = db.doc(`users/${user.uid}/notifications/${input.id}`);
      await ref.update({ read: true });
      return Response.json({ ok: true });
    }
    if (
      input.action === "answer" ||
      input.action === "accept" ||
      input.action === "vote"
    ) {
      const doubt = db.doc(`doubts/${input.id}`);
      await db.runTransaction(async (tx) => {
        const parent = await tx.get(doubt);
        if (!parent.exists) throw new HttpError(404, "Doubt not found.");
        const data = parent.data()!;
        if (input.action === "answer") {
          const ref = doubt.collection("answers").doc();
          tx.set(ref, {
            text: input.text,
            name,
            authorId: user.uid,
            votes: 0,
            createdAt,
          });
          tx.set(db.doc(`users/${user.uid}/contributions/${ref.id}`), {
            path: ref.path,
          });
          if (data.authorId && data.authorId !== user.uid)
            tx.set(
              db.collection(`users/${data.authorId}/notifications`).doc(),
              {
                text: "Your doubt received an answer.",
                href: "/doubts",
                read: false,
                createdAt,
              },
            );
          return;
        }
        const answer = doubt.collection("answers").doc(input.answerId);
        const snapshot = await tx.get(answer);
        if (!snapshot.exists) throw new HttpError(404, "Answer not found.");
        if (input.action === "accept") {
          if (data.authorId !== user.uid)
            throw new HttpError(
              403,
              "Only the doubt author can accept an answer.",
            );
          tx.update(doubt, { acceptedId: answer.id });
          return;
        }
        const vote = answer.collection("votes").doc(user.uid);
        const prior = await tx.get(vote);
        if (prior.exists)
          throw new HttpError(409, "You already voted for this answer.");
        tx.set(vote, { createdAt });
        tx.set(
          db.doc(
            `users/${user.uid}/contributions/${vote.id}_${input.answerId}`,
          ),
          { path: vote.path },
        );
        tx.update(answer, { votes: FieldValue.increment(1) });
      });
      return Response.json({ ok: true });
    }
    if (input.action === "space") {
      if (input.kind === "class" && !user.teacher && !user.admin)
        throw new HttpError(403, "Verified teacher access is required.");
      const ref = db.collection("spaces").doc();
      await ref.set({
        title: input.title,
        description: input.description,
        kind: input.kind,
        private: input.kind === "class" ? true : input.private,
        closed: false,
        notes: "",
        ownerId: user.uid,
        memberIds: [user.uid],
        createdAt,
      });
      return Response.json({ id: ref.id });
    }
    const ref = db.doc(`spaces/${input.id}`);
    await db.runTransaction(async (tx) => {
      const snapshot = await tx.get(ref);
      if (!snapshot.exists) throw new HttpError(404, "Space not found.");
      const space = snapshot.data() as SpacePolicy;
      if (input.action === "join") {
        const invitation = await tx.get(
          db.doc(`users/${user.uid}/invitations/${ref.id}`),
        );
        const allowedInvitation =
          invitation.exists &&
          !space.closed &&
          !isMember(space, user.uid) &&
          space.memberIds.length < 100;
        if (!canJoin(space, user.uid) && !allowedInvitation)
          throw new HttpError(
            403,
            "This space requires an invitation or is full/closed.",
          );
        tx.update(ref, { memberIds: FieldValue.arrayUnion(user.uid) });
        return;
      }
      if (!isMember(space, user.uid))
        throw new HttpError(403, "Membership required.");
      if (input.action === "leave") {
        if (space.ownerId === user.uid)
          throw new HttpError(400, "Owners must close their space instead.");
        tx.update(ref, { memberIds: FieldValue.arrayRemove(user.uid) });
        return;
      }
      if (input.action === "close" || input.action === "invite") {
        if (space.ownerId !== user.uid)
          throw new HttpError(403, "Owner access required.");
        if (input.action === "close") {
          tx.update(ref, { closed: true });
          return;
        }
        if (space.closed || space.memberIds.length >= 100)
          throw new HttpError(409, "This space is closed or full.");
        const invitee = await tx.get(db.doc(`users/${input.uid}`));
        if (!invitee.exists) throw new HttpError(404, "Account not found.");
        tx.set(db.collection(`users/${input.uid}/notifications`).doc(), {
          text: `You were invited to ${snapshot.data()!.title}.`,
          href: "/communities",
          read: false,
          createdAt,
        });
        tx.set(db.doc(`users/${input.uid}/invitations/${ref.id}`), {
          createdAt,
          spaceId: ref.id,
        });
        return;
      }
      if (input.action === "notes") {
        if (space.kind !== "room" || space.closed)
          throw new HttpError(403, "An active study room is required.");
        tx.update(ref, {
          notes: input.text,
          notesAuthorId: user.uid,
          updatedAt: createdAt,
        });
        return;
      }
      if (input.action === "post") {
        if (!canPublish(space, user.uid, input.announcement))
          throw new HttpError(403, "Posting not permitted.");
        const post = ref.collection("posts").doc();
        tx.set(post, {
          text: input.text,
          name,
          authorId: user.uid,
          announcement: input.announcement,
          createdAt,
        });
        tx.set(db.doc(`users/${user.uid}/contributions/${post.id}`), {
          path: post.path,
        });
      }
    });
    return Response.json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
