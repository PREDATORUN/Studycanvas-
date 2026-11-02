"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers";
import { api } from "@/services/api";
import { chapters } from "./catalog";
import type { Answer, PublicQuestion } from "./scoring";
import { AnswerInput } from "./answer-input";
export function Practice() {
  const { user } = useAuth();
  const [bank, setBank] = useState<PublicQuestion[]>([]);
  const [records, setRecords] = useState<Record<string, unknown>[]>([]);
  const [chapter, setChapter] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [mode, setMode] = useState("all");
  const [position, setPosition] = useState(0);
  const [value, setValue] = useState<Answer>(null);
  const [result, setResult] = useState<{
    correct: boolean;
    explanation: string;
    answer: Answer;
    saved: boolean;
  } | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [started, setStarted] = useState(0);
  useEffect(() => {
    let active = true;
    fetch("/api/learning?kind=bank")
      .then((r) => {
        if (!r.ok) throw new Error("Question bank is unavailable.");
        return r.json();
      })
      .then((d) => {
        if (active) setBank(d.questions ?? []);
      })
      .catch(() => setError("Question bank could not load. Refresh to retry."));
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (!user?.emailVerified) return;
    let active = true;
    api<{ records: Record<string, unknown>[] }>("learning")
      .then((d) => {
        if (active) setRecords(d.records);
      })
      .catch((e) => setError(e.message));
    return () => {
      active = false;
    };
  }, [user]);
  const filtered = bank.filter(
    (q) =>
      (!chapter || q.chapterId === chapter) &&
      (!difficulty || q.difficulty === difficulty) &&
      (mode === "all" ||
        records.some(
          (r) =>
            r.questionId === q.id &&
            (mode === "bookmarked"
              ? r.kind === "bookmark" && r.value
              : r.kind === "practice" && !r.correct),
        )),
  );
  const q = filtered[position % Math.max(filtered.length, 1)];
  function reset() {
    setPosition(0);
    setValue(null);
    setResult(null);
    setStarted(Date.now());
  }
  async function submit() {
    if (!q) return;
    setBusy(true);
    setError("");
    try {
      const payload = {
        action: "answer",
        questionId: q.id,
        answer: value,
        timeSeconds: started ? (Date.now() - started) / 1000 : 0,
      };
      let data;
      if (user?.emailVerified)
        data = await api<typeof result>("learning", "POST", payload);
      else {
        const res = await fetch("/api/learning", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        data = await res.json();
        if (!res.ok) throw new Error("Answer could not be checked.");
      }
      setResult(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="eyebrow">ORIGINAL PRACTICE · STARTER BANK</div>
      <h1>Think it through.</h1>
      <p>
        12 original questions. No official PYQs or syllabus-completeness claim.{" "}
        {user?.emailVerified
          ? "Your latest attempt per question saves privately."
          : "Guest answers are checked but are not saved."}
      </p>
      <div className="filters">
        <label>
          Chapter
          <select
            value={chapter}
            onChange={(e) => {
              setChapter(e.target.value);
              reset();
            }}
          >
            <option value="">All chapters</option>
            {chapters.map((c) => (
              <option value={c.id} key={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          Difficulty
          <select
            value={difficulty}
            onChange={(e) => {
              setDifficulty(e.target.value);
              reset();
            }}
          >
            <option value="">All levels</option>
            {["Easy", "Medium", "Hard"].map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </label>
        <label>
          Mode
          <select
            value={mode}
            onChange={(e) => {
              setMode(e.target.value);
              reset();
            }}
          >
            <option value="all">Mixed practice</option>
            <option value="incorrect">Incorrect retry (saved)</option>
            <option value="bookmarked">Bookmarks (saved)</option>
          </select>
        </label>
      </div>
      {q ? (
        <section className="card question-card">
          <div className="row spread">
            <span className="pill">
              {q.subject} · {q.difficulty} · {q.kind}
            </span>
            <span>
              {(position % filtered.length) + 1}/{filtered.length}
            </span>
          </div>
          <h2>{q.statement}</h2>
          <AnswerInput
            question={q}
            value={value}
            disabled={busy || !!result}
            onChange={(a) => {
              setValue(a);
              if (!started) setStarted(Date.now());
            }}
          />
          <div className="row">
            <button
              className="button"
              disabled={busy || !!result || value === null || value === ""}
              onClick={() => void submit()}
            >
              Check answer
            </button>
            <button
              className="button secondary"
              onClick={() => {
                setPosition((p) => p + 1);
                setValue(null);
                setResult(null);
                setStarted(Date.now());
              }}
            >
              Next question →
            </button>
            <button
              className="text-link"
              disabled={!user?.emailVerified || busy}
              onClick={async () => {
                setBusy(true);
                try {
                  const marked = records.some(
                    (r) =>
                      r.kind === "bookmark" && r.questionId === q.id && r.value,
                  );
                  await api("learning", "POST", {
                    action: "bookmark",
                    questionId: q.id,
                    value: !marked,
                  });
                  const d = await api<{ records: Record<string, unknown>[] }>(
                    "learning",
                  );
                  setRecords(d.records);
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              Toggle bookmark
            </button>
          </div>
          {result && (
            <div className="notice" role="status">
              <strong>
                {result.correct ? "Correct." : "Review this one."}
              </strong>
              <p>{result.explanation}</p>
              <small>
                {result.saved
                  ? "Latest attempt saved to your account."
                  : "Guest attempt · not saved."}
              </small>
            </div>
          )}
        </section>
      ) : (
        <div className="card empty">
          No questions match these filters. Saved retry and bookmark modes
          require an account.
        </div>
      )}
      <p role="alert">{error}</p>
    </>
  );
}
