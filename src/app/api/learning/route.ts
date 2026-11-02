import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { questions, patterns } from "@/features/learning/bank";
import {
  acceptedResponses,
  publicQuestion,
  correct,
  evaluate,
  type Answer,
} from "@/features/learning/scoring";
import { chapters } from "@/features/learning/catalog";
import { database } from "@/lib/firebase/admin";
import { authorize, mutation, body, failure, HttpError } from "@/lib/server";
export const runtime = "nodejs";
const answer = z.union([
  z.string().max(100),
  z.number().finite(),
  z.array(z.number().int().min(0).max(20)).max(20),
  z.null(),
]);
const schema = z.discriminatedUnion("action", [
  z
    .object({
      action: z.literal("answer"),
      questionId: z.string().max(60),
      answer,
      timeSeconds: z.number().min(0).max(86400),
    })
    .strict(),
  z
    .object({
      action: z.literal("bookmark"),
      questionId: z.string().max(60),
      value: z.boolean(),
    })
    .strict(),
  z
    .object({
      action: z.literal("chapter"),
      chapterId: z.string().max(60),
      completed: z.boolean(),
    })
    .strict(),
  z
    .object({ action: z.literal("start"), patternId: z.string().max(60) })
    .strict(),
  z
    .object({
      action: z.enum(["save", "submit"]),
      attemptId: z.string().regex(/^[a-zA-Z0-9_-]{1,128}$/),
      responses: z.record(z.string().max(60), answer),
      review: z.array(z.string().max(60)).max(100),
    })
    .strict(),
]);
export async function GET(req: Request) {
  try {
    const kind = new URL(req.url).searchParams.get("kind");
    if (kind === "bank")
      return Response.json({
        questions: questions.map(publicQuestion),
        patterns,
      });
    const user = await authorize(req);
    const base = database().collection(`users/${user.uid}/learning`);
    const docs = await base.limit(250).get();
    return Response.json({
      records: docs.docs.map((d) => ({ id: d.id, ...d.data() })),
    });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(req: Request) {
  try {
    const input = schema.parse(await body(req));
    if (input.action === "answer") {
      const q = questions.find((q) => q.id === input.questionId);
      if (!q) throw new HttpError(404, "Question not found.");
      const result = {
        correct: correct(q, input.answer),
        answer: q.answer,
        explanation: q.explanation,
      };
      // Guest practice is graded, but no account or persisted activity is fabricated.
      let saved = false;
      if (req.headers.has("authorization")) {
        const user = await mutation(req);
        await database()
          .collection(`users/${user.uid}/learning`)
          .doc(`practice_${q.id}`)
          .set(
            {
              kind: "practice",
              questionId: q.id,
              chapterId: q.chapterId,
              subject: q.subject,
              response: input.answer,
              ...result,
              timeSeconds: input.timeSeconds,
              updatedAt: FieldValue.serverTimestamp(),
            },
            { merge: true },
          );
        saved = true;
      }
      return Response.json({ ...result, saved });
    }
    const user = await mutation(req);
    const base = database().collection(`users/${user.uid}/learning`);
    if (input.action === "bookmark") {
      if (!questions.some((q) => q.id === input.questionId))
        throw new HttpError(404, "Question not found.");
      await base.doc(`bookmark_${input.questionId}`).set({
        kind: "bookmark",
        questionId: input.questionId,
        value: input.value,
        updatedAt: FieldValue.serverTimestamp(),
      });
      return Response.json({ ok: true });
    }
    if (input.action === "chapter") {
      if (!chapters.some((c) => c.id === input.chapterId))
        throw new HttpError(404, "Chapter not found.");
      await base.doc(`chapter_${input.chapterId}`).set({
        kind: "chapter",
        chapterId: input.chapterId,
        completed: input.completed,
        updatedAt: FieldValue.serverTimestamp(),
      });
      return Response.json({ ok: true });
    }
    if (input.action === "start") {
      const pattern = patterns.find((p) => p.id === input.patternId);
      if (!pattern) throw new HttpError(404, "Test not found.");
      const ref = base.doc();
      const startedAt = Date.now();
      await ref.set({
        kind: "mock",
        patternId: pattern.id,
        patternVersion: pattern.version,
        startedAt,
        deadline: startedAt + pattern.durationSeconds * 1000,
        responses: {},
        review: [],
        status: "active",
      });
      return Response.json(
        {
          id: ref.id,
          patternId: pattern.id,
          startedAt,
          deadline: startedAt + pattern.durationSeconds * 1000,
          responses: {},
          review: [],
          status: "active",
        },
        { status: 201 },
      );
    }
    const ref = base.doc(input.attemptId);
    const result = await database().runTransaction(async (tx) => {
      const snapshot = await tx.get(ref);
      const attempt = snapshot.data();
      if (!attempt || attempt.kind !== "mock")
        throw new HttpError(404, "Attempt not found.");
      if (attempt.status === "submitted") return { id: ref.id, ...attempt };
      const pattern = patterns.find(
        (p) =>
          p.id === attempt.patternId && p.version === attempt.patternVersion,
      );
      if (!pattern)
        throw new HttpError(409, "This test version is unavailable.");
      const expired = Date.now() >= attempt.deadline;
      // At expiry only previously saved answers count. Client changes after deadline are discarded.
      const responses: Record<string, Answer> = acceptedResponses(
        attempt.deadline,
        Date.now(),
        attempt.responses,
        input.responses,
        pattern.questionIds,
      );
      const submitted = expired || input.action === "submit";
      const testQuestions = pattern.questionIds.map((id) =>
        questions.find((q) => q.id === id)!,
      );
      const next = {
        ...attempt,
        responses,
        review: input.review.filter((id) => pattern.questionIds.includes(id)),
        status: submitted ? "submitted" : "active",
        ...(submitted
          ? {
              result: evaluate(testQuestions, responses, pattern),
              submittedAt: Date.now(),
              timeSeconds: Math.min(
                pattern.durationSeconds,
                Math.max(0, (Date.now() - attempt.startedAt) / 1000),
              ),
            }
          : {}),
      };
      tx.set(ref, next);
      return { id: ref.id, ...next };
    });
    return Response.json(result);
  } catch (e) {
    return failure(e);
  }
}
