"use client";
import { useEffect, useState } from "react";
import { api } from "@/services/api";
type Insights = {
  attempted: number;
  accuracy: number;
  meanSeconds: number;
  completedChapters: number;
  tests: { id: string; score: number; maxScore: number }[];
  subjects: Record<string, { correct: number; attempted: number }>;
};
export function Analytics() {
  const [data, setData] = useState<Insights | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    api<Insights>("insights")
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);
  if (error) return <p role="alert">{error}</p>;
  if (!data)
    return (
      <div className="skeleton">Loading your actual learning records…</div>
    );
  return (
    <>
      <h1>Understand your progress.</h1>
      <p>
        Practice metrics use the latest saved response per question in the
        loaded records. No estimated ranks or percentiles.
      </p>
      <div className="stats-grid">
        {[
          ["Questions attempted", data.attempted],
          ["Accuracy", `${data.accuracy}%`],
          ["Mean answer time", `${data.meanSeconds}s`],
          ["Completed guides", data.completedChapters],
        ].map(([label, value]) => (
          <article className="card stat" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </div>
      <section className="card">
        <h2>Subject accuracy</h2>
        {Object.entries(data.subjects).map(([subject, v]) => (
          <div key={subject}>
            <p>
              {subject}: {v.correct}/{v.attempted} correct
            </p>
            <progress
              aria-label={`${subject} accuracy`}
              value={v.correct}
              max={v.attempted || 1}
            />
          </div>
        ))}
        {!data.attempted && <p>No saved practice attempts yet.</p>}
        <h2>Saved mock scores</h2>
        {data.tests.map((t, i) => (
          <p key={t.id}>
            Recorded test {i + 1}: {t.score}/{t.maxScore}
          </p>
        ))}
        <small>
          Accuracy = correct / attempted × 100. Mean time uses submitted
          client-reported practice seconds. Guide completion is self-reported.
          Maximum 250 learning records per query.
        </small>
      </section>
    </>
  );
}
