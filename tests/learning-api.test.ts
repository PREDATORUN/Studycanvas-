import { describe, it, expect } from "vitest";
import { GET, POST } from "../src/app/api/learning/route";
const request = (body: unknown) =>
  new Request("https://study.test/api/learning", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
describe("learning route integration without Firebase", () => {
  it("serves original questions without solutions", async () => {
    const res = await GET(
      new Request("https://study.test/api/learning?kind=bank"),
    );
    expect(res.status).toBe(200);
    const d = await res.json();
    expect(d.questions).toHaveLength(12);
    expect(
      d.questions.every(
        (q: Record<string, unknown>) =>
          !("answer" in q) && !("explanation" in q),
      ),
    ).toBe(true);
  });
  it("grades guest answers without claiming persistence", async () => {
    const r = await POST(
      request({
        action: "answer",
        questionId: "p1",
        answer: "1",
        timeSeconds: 20,
      }),
    );
    expect(r.status).toBe(200);
    expect(await r.json()).toMatchObject({ correct: true, saved: false });
  });
  it("returns a useful explanation on incorrect answers", async () => {
    const r = await POST(
      request({
        action: "answer",
        questionId: "p1",
        answer: "0",
        timeSeconds: 2,
      }),
    );
    expect(await r.json()).toMatchObject({
      correct: false,
      explanation: expect.stringContaining("16 J"),
    });
  });
  it("rejects unknown questions", async () => {
    expect(
      (
        await POST(
          request({
            action: "answer",
            questionId: "missing",
            answer: "0",
            timeSeconds: 2,
          }),
        )
      ).status,
    ).toBe(404);
  });
  it("rejects client-supplied score injection", async () => {
    expect(
      (
        await POST(
          request({
            action: "answer",
            questionId: "p1",
            answer: "0",
            timeSeconds: 2,
            correct: true,
          }),
        )
      ).status,
    ).toBe(400);
  });
  it("does not start persisted tests without Firebase", async () => {
    expect(
      (await POST(request({ action: "start", patternId: "jee-main-starter" })))
        .status,
    ).toBe(503);
  });
});
