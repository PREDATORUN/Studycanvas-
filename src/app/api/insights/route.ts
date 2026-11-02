import { database } from "@/lib/firebase/admin";
import { authorize, failure } from "@/lib/server";
export async function GET(req: Request) {
  try {
    const user = await authorize(req);
    const docs = await database()
      .collection(`users/${user.uid}/learning`)
      .limit(250)
      .get();
    const records: {
      id: string;
      kind?: string;
      subject?: string;
      correct?: boolean;
      completed?: boolean;
      timeSeconds?: number;
      status?: string;
      result?: { score: number; maxScore: number };
    }[] = docs.docs.map((d) => ({ id: d.id, ...d.data() }));
    const practice = records.filter((r) => r.kind === "practice");
    const subjects: Record<string, { correct: number; attempted: number }> = {};
    for (const p of practice) {
      const part = (subjects[String(p.subject)] ??= {
        correct: 0,
        attempted: 0,
      });
      part.attempted++;
      if (p.correct) part.correct++;
    }
    return Response.json({
      attempted: practice.length,
      accuracy: practice.length
        ? Math.round(
            (practice.filter((p) => p.correct).length / practice.length) * 100,
          )
        : 0,
      meanSeconds: practice.length
        ? Math.round(
            practice.reduce((s, p) => s + Number(p.timeSeconds ?? 0), 0) /
              practice.length,
          )
        : 0,
      completedChapters: records.filter(
        (p) => p.kind === "chapter" && p.completed,
      ).length,
      tests: records
        .filter((p) => p.kind === "mock" && p.status === "submitted")
        .map((p) => ({
          id: p.id,
          score: p.result?.score ?? 0,
          maxScore: p.result?.maxScore ?? 0,
        })),
      subjects,
    });
  } catch (e) {
    return failure(e);
  }
}
