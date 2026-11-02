export type Answer = string | number | number[] | null;
export type Question = {
  id: string;
  chapterId: string;
  subject: string;
  difficulty: "Easy" | "Medium" | "Hard";
  kind: "single" | "multiple" | "numerical" | "integer" | "match";
  statement: string;
  options?: string[];
  answer: Answer;
  explanation: string;
  tolerance?: number;
};
export type PublicQuestion = Omit<
  Question,
  "answer" | "explanation" | "tolerance"
>;
export function publicQuestion(q: Question): PublicQuestion {
  const { id, chapterId, subject, difficulty, kind, statement, options } = q;
  return {
    id,
    chapterId,
    subject,
    difficulty,
    kind,
    statement,
    ...(options ? { options } : {}),
  };
}
export function answered(a: Answer) {
  return (
    a !== null &&
    (typeof a !== "string" || a.trim() !== "") &&
    (!Array.isArray(a) || a.length > 0)
  );
}
export function correct(q: Question, a: Answer) {
  if (!answered(a)) return false;
  if (q.kind === "multiple") {
    if (!Array.isArray(a) || !Array.isArray(q.answer)) return false;
    const v = [...new Set(a)].sort();
    const expected = [...q.answer].sort();
    return v.length === expected.length && v.every((n, i) => n === expected[i]);
  }
  if (q.kind === "numerical" || q.kind === "integer") {
    if (Array.isArray(a) || typeof a === "boolean") return false;
    const n = Number(a);
    return (
      Number.isFinite(n) &&
      (q.kind !== "integer" || Number.isInteger(n)) &&
      Math.abs(n - Number(q.answer)) <= (q.tolerance ?? 0)
    );
  }
  return a === q.answer;
}
export type Pattern = {
  id: string;
  version: number;
  label: string;
  durationSeconds: number;
  marks: number;
  penalty: number;
  questionIds: string[];
};
export function evaluate(
  questions: Question[],
  responses: Record<string, Answer>,
  pattern: Pattern,
) {
  let right = 0,
    wrong = 0,
    unattempted = 0;
  const breakdown: Record<
    string,
    { correct: number; incorrect: number; unattempted: number }
  > = {};
  const review = questions.map((q) => {
    const response = responses[q.id] ?? null;
    const attempted = answered(response);
    const isCorrect = correct(q, response);
    const part = (breakdown[q.subject] ??= {
      correct: 0,
      incorrect: 0,
      unattempted: 0,
    });
    if (!attempted) {
      unattempted++;
      part.unattempted++;
    } else if (isCorrect) {
      right++;
      part.correct++;
    } else {
      wrong++;
      part.incorrect++;
    }
    return {
      id: q.id,
      response,
      correct: isCorrect,
      answer: q.answer,
      explanation: q.explanation,
      chapterId: q.chapterId,
    };
  });
  return {
    score: right * pattern.marks - wrong * pattern.penalty,
    maxScore: questions.length * pattern.marks,
    correct: right,
    incorrect: wrong,
    unattempted,
    accuracy: right + wrong ? Math.round((right / (right + wrong)) * 100) : 0,
    breakdown,
    review,
  };
}

export function acceptedResponses(
  deadline: number,
  now: number,
  saved: Record<string, Answer>,
  incoming: Record<string, Answer>,
  ids: string[],
) {
  return now >= deadline
    ? saved
    : Object.fromEntries(
        Object.entries(incoming).filter(([id]) => ids.includes(id)),
      );
}
