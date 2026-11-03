import { describe, it, expect } from "vitest";
import { questions, patterns } from "../src/features/learning/bank";
import {
  correct,
  evaluate,
  publicQuestion,
  acceptedResponses,
  answered,
} from "../src/features/learning/scoring";
describe("original question bank", () => {
  it("contains unique IDs and valid chapter associations", () => {
    expect(new Set(questions.map((q) => q.id)).size).toBe(questions.length);
    for (const p of patterns)
      for (const id of p.questionIds)
        expect(questions.some((q) => q.id === id)).toBe(true);
  });
  it("keeps solutions out of public questions", () => {
    for (const q of questions) {
      expect(publicQuestion(q)).not.toHaveProperty("answer");
      expect(publicQuestion(q)).not.toHaveProperty("explanation");
    }
  });
  it("accepts each canonical answer", () => {
    for (const q of questions) expect(correct(q, q.answer), q.id).toBe(true);
  });
  it("rejects partial multiple-correct answers", () => {
    expect(
      correct(
        questions.find((q) => q.id === "p3")!,
        [1],
      ),
    ).toBe(false);
  });
  it("accepts unordered multiple answers", () => {
    expect(
      correct(
        questions.find((q) => q.id === "p3")!,
        [2, 1],
      ),
    ).toBe(true);
  });
  it("uses numerical tolerance", () => {
    const q = questions.find((q) => q.id === "p2")!;
    expect(correct(q, 1.0005)).toBe(true);
    expect(correct(q, 1.01)).toBe(false);
  });
  it("rejects noninteger answers in integer mode", () => {
    expect(
      correct(
        questions.find((q) => q.id === "m1")!,
        10.1,
      ),
    ).toBe(false);
  });
  it("does not turn whitespace into numerical zero", () => {
    expect(answered("  ")).toBe(false);
    expect(answered([])).toBe(false);
  });
  it("does not penalize skipped questions", () => {
    const p = patterns[0];
    const qs = p.questionIds.map((id) => questions.find((q) => q.id === id)!);
    const result = evaluate(qs, {}, p);
    expect(result.score).toBe(0);
    expect(result.unattempted).toBe(6);
    expect(result.accuracy).toBe(0);
  });
  it("scores wrong answers negatively", () => {
    const p = patterns[0];
    const result = evaluate([questions[0]], { p1: "3" }, p);
    expect(result.score).toBe(-1);
    expect(result.incorrect).toBe(1);
  });
  it("reports perfect scores without ranks", () => {
    const p = patterns[0];
    const qs = p.questionIds.map((id) => questions.find((q) => q.id === id)!);
    const result = evaluate(
      qs,
      Object.fromEntries(qs.map((q) => [q.id, q.answer])),
      p,
    );
    expect(result.score).toBe(24);
    expect(result.accuracy).toBe(100);
    expect(result).not.toHaveProperty("percentile");
  });
  it("freezes saved answers at deadline", () => {
    expect(
      acceptedResponses(100, 100, { p1: "0" }, { p1: "1" }, ["p1"]),
    ).toEqual({ p1: "0" });
  });
  it("rejects answers to injected test question IDs", () => {
    expect(
      acceptedResponses(100, 99, {}, { p1: "1", b1: "0" }, ["p1"]),
    ).toEqual({ p1: "1" });
  });
});
