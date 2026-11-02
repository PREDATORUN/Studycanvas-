"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/services/api";
import type { Answer, Pattern, PublicQuestion, evaluate } from "./scoring";
import { AnswerInput } from "./answer-input";
type Attempt = {
  id: string;
  patternId: string;
  deadline: number;
  responses: Record<string, Answer>;
  review: string[];
  status: string;
  result?: ReturnType<typeof evaluate>;
  timeSeconds?: number;
};
export function Mocks() {
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [bank, setBank] = useState<PublicQuestion[]>([]);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [index, setIndex] = useState(0);
  const [history, setHistory] = useState<Attempt[]>([]);
  const [now, setNow] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const current = useRef(attempt);
  const inFlight = useRef(false);
  const retryAfter = useRef(0);
  useEffect(() => {
    current.current = attempt;
  }, [attempt]);
  useEffect(() => {
    let active = true;
    Promise.all([
      fetch("/api/learning?kind=bank").then((r) => r.json()),
      api<{ records: (Attempt & { kind: string })[] }>("learning"),
    ])
      .then(([b, d]) => {
        if (!active) return;
        setBank(b.questions);
        setPatterns(b.patterns);
        setHistory(
          d.records.filter(
            (a) => a.kind === "mock" && a.status === "submitted",
          ),
        );
        const activeAttempt = d.records
          .filter((a) => a.kind === "mock" && a.status === "active")
          .sort((a, b) => b.deadline - a.deadline)[0];
        if (activeAttempt) setAttempt(activeAttempt);
      })
      .catch((e) => setError(e.message));
    return () => {
      active = false;
    };
  }, []);
  const save = useCallback(async (final = false) => {
    const value = current.current;
    if (
      !value ||
      value.status !== "active" ||
      inFlight.current ||
      Date.now() < retryAfter.current
    )
      return;
    inFlight.current = true;
    setBusy(true);
    try {
      const updated = await api<Attempt>("learning", "POST", {
        action: final ? "submit" : "save",
        attemptId: value.id,
        responses: value.responses,
        review: value.review,
      });
      setAttempt((old) => (old?.id === updated.id ? updated : old));
      setError("");
      if (updated.status === "submitted")
        setHistory((old) => [
          updated,
          ...old.filter((a) => a.id !== updated.id),
        ]);
    } catch (e) {
      setError((e as Error).message);
      retryAfter.current = Date.now() + 15000;
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }, []);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    const timer = setInterval(() => {
      void save();
    }, 15000);
    return () => clearInterval(timer);
  }, [save]);
  useEffect(() => {
    if (attempt?.status === "active" && now >= attempt.deadline)
      void save(true);
  }, [now, attempt?.deadline, attempt?.status, save]);
  const pattern = patterns.find((p) => p.id === attempt?.patternId);
  const qs =
    pattern?.questionIds
      .map((id) => bank.find((q) => q.id === id))
      .filter((q): q is PublicQuestion => !!q) ?? [];
  const q = qs[index];
  const remaining = attempt
    ? Math.max(0, Math.ceil((attempt.deadline - now) / 1000))
    : 0;
  return (
    <>
      <div className="eyebrow">TIMED ASSESSMENTS · VERSIONED SIMULATIONS</div>
      <h1>Meet your next benchmark.</h1>
      <p>
        Short original starter simulations. These do not reproduce official
        examination patterns or provide national ranks.
      </p>
      <p role="alert">{error}</p>
      {history.length > 0 && (
        <details>
          <summary>Saved test results ({history.length})</summary>
          {history.map((item) => (
            <button
              key={item.id}
              className="button secondary"
              onClick={() => setAttempt(item)}
            >
              {patterns.find((p) => p.id === item.patternId)?.label ??
                item.patternId}
              : {item.result?.score}/{item.result?.maxScore}
            </button>
          ))}
        </details>
      )}
      {!attempt ? (
        <div className="learning-grid">
          {patterns.map((p) => (
            <article className="card" key={p.id}>
              <span className="pill">
                v{p.version} · {p.durationSeconds / 60} minutes
              </span>
              <h2>{p.label}</h2>
              <p>
                {p.questionIds.length} questions · +{p.marks} correct / −
                {p.penalty} incorrect · no partial credit
              </p>
              <button
                className="button"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    const data = await api<Attempt>("learning", "POST", {
                      action: "start",
                      patternId: p.id,
                    });
                    setAttempt(data);
                    setIndex(0);
                  } catch (e) {
                    setError((e as Error).message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Start simulation
              </button>
            </article>
          ))}
        </div>
      ) : attempt.result ? (
        <section className="card">
          <h2>
            Results: {attempt.result.score}/{attempt.result.maxScore}
          </h2>
          <p>
            {attempt.result.correct} correct · {attempt.result.incorrect}{" "}
            incorrect · {attempt.result.unattempted} unattempted ·{" "}
            {attempt.result.accuracy}% attempted accuracy
          </p>
          <p>
            Time: {Math.round(attempt.timeSeconds ?? 0)} seconds. Accuracy =
            correct ÷ attempted × 100.
          </p>
          {Object.entries(attempt.result.breakdown).map(([subject, d]) => (
            <p key={subject}>
              {subject}: {d.correct} correct, {d.incorrect} incorrect,{" "}
              {d.unattempted} unattempted.
            </p>
          ))}
          {attempt.result.review.map((r) => (
            <details key={r.id}>
              <summary>
                {bank.find((q) => q.id === r.id)?.statement} —{" "}
                {r.correct ? "Correct" : "Review"}
              </summary>
              <p>{r.explanation}</p>
            </details>
          ))}
          <p>
            Next step: revisit the guides for questions marked “Review”, then
            retry them in practice.
          </p>
          <button className="button" onClick={() => setAttempt(null)}>
            Choose another test
          </button>
        </section>
      ) : q ? (
        <section className="card">
          <div className="row spread">
            <span className="pill">{pattern?.label}</span>
            <strong role="timer" aria-label="Time remaining">
              {Math.floor(remaining / 60)}:
              {String(remaining % 60).padStart(2, "0")}
            </strong>
          </div>
          <nav className="question-palette" aria-label="Test questions">
            {qs.map((item, i) => (
              <button
                aria-current={i === index ? "step" : undefined}
                key={item.id}
                className="button secondary"
                onClick={() => setIndex(i)}
              >
                {i + 1}
                {attempt.review.includes(item.id) ? " ★" : ""}
                {attempt.responses[item.id] != null ? " •" : ""}
              </button>
            ))}
          </nav>
          <h2>{q.statement}</h2>
          <AnswerInput
            question={q}
            disabled={busy || remaining === 0}
            value={attempt.responses[q.id] ?? null}
            onChange={(a) =>
              setAttempt((old) =>
                old
                  ? { ...old, responses: { ...old.responses, [q.id]: a } }
                  : old,
              )
            }
          />
          <div className="row wrap">
            <button
              className="button secondary"
              disabled={busy}
              onClick={() =>
                setAttempt((old) =>
                  old
                    ? { ...old, responses: { ...old.responses, [q.id]: null } }
                    : old,
                )
              }
            >
              Clear response
            </button>
            <button
              className="button secondary"
              disabled={busy}
              onClick={() =>
                setAttempt((old) =>
                  old
                    ? {
                        ...old,
                        review: old.review.includes(q.id)
                          ? old.review.filter((id) => id !== q.id)
                          : [...old.review, q.id],
                      }
                    : old,
                )
              }
            >
              Toggle review ★
            </button>
            <button
              className="button secondary"
              disabled={busy}
              onClick={() => void save()}
            >
              Save now
            </button>
            <button
              className="button"
              disabled={busy}
              onClick={() => {
                if (
                  window.confirm(
                    "Submit this simulation? Submitted answers cannot be changed.",
                  )
                )
                  void save(true);
              }}
            >
              Submit test
            </button>
          </div>
          <small>
            Autosaves every 15 seconds. At expiry, only answers already saved on
            the server count. Failed saves are shown above; keep this page open
            until saved.
          </small>
        </section>
      ) : (
        <div className="card">Loading questions…</div>
      )}
    </>
  );
}
