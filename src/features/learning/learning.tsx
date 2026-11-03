"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { trackChapters, tracks, catalogVersion } from "./catalog";
import { useAuth } from "@/components/providers";
import { api } from "@/services/api";
export function Learning() {
  const { user } = useAuth();
  const [track, setTrack] = useState<string>("JEE Main");
  const [grade, setGrade] = useState("all");
  const [done, setDone] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!user?.emailVerified) return;
    let active = true;
    api<{ records: { kind: string; chapterId: string; completed: boolean }[] }>(
      "learning",
    )
      .then((d) => {
        if (active)
          setDone(
            d.records
              .filter((r) => r.kind === "chapter" && r.completed)
              .map((r) => r.chapterId),
          );
      })
      .catch((e) => setError(e.message));
    return () => {
      active = false;
    };
  }, [user]);
  return (
    <>
      <div className="eyebrow">LEARNING TRACKS · {catalogVersion}</div>
      <h1>Build understanding.</h1>
      <p>
        A deliberately small starter curriculum with original chapter guides.
        This is not a verified complete official syllabus.
      </p>
      <div className="filters">
        <label>
          Track
          <select value={track} onChange={(e) => setTrack(e.target.value)}>
            {tracks.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <label>
          Class
          <select value={grade} onChange={(e) => setGrade(e.target.value)}>
            <option value="all">11 & 12</option>
            <option>11</option>
            <option>12</option>
          </select>
        </label>
      </div>
      <div className="learning-grid">
        {trackChapters(track)
          .filter((c) => grade === "all" || String(c.grade) === grade)
          .map((c) => (
            <article className="card" key={c.id}>
              <span className="pill">
                {c.subject} · Class {c.grade}
              </span>
              <h2>{c.title}</h2>
              <p>{c.objective}</p>
              <small>{c.topics.join(" · ")}</small>
              <details>
                <summary>Read chapter guide</summary>
                <p>{c.notes}</p>
              </details>
              <Link className="text-link" href="/practice">
                Open practice →
              </Link>
              <label className="answer-option">
                <input
                  type="checkbox"
                  disabled={!user?.emailVerified || busy}
                  checked={done.includes(c.id)}
                  onChange={async (e) => {
                    const completed = e.target.checked;
                    setBusy(true);
                    try {
                      await api("learning", "POST", {
                        action: "chapter",
                        chapterId: c.id,
                        completed,
                      });
                      setDone((current) =>
                        completed
                          ? [...current, c.id]
                          : current.filter((id) => id !== c.id),
                      );
                    } catch (e) {
                      setError((e as Error).message);
                    } finally {
                      setBusy(false);
                    }
                  }}
                />
                Mark guide complete
              </label>
            </article>
          ))}
      </div>
      <p>Sign in with a verified email to save chapter completion.</p>
      <p role="alert">{error}</p>
    </>
  );
}
