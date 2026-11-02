"use client";
import { useState } from "react";
import { chapters } from "./catalog";
export function Resources() {
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("");
  return (
    <>
      <div className="eyebrow">RESOURCE LIBRARY · ORIGINAL CONTENT</div>
      <h1>Keep the essentials close.</h1>
      <p>
        Original StudyCanvas starter guides, licensed CC BY 4.0. Teacher
        publishing and secure uploads are not available yet.
      </p>
      <div className="filters">
        <label>
          Search
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Find a topic or chapter"
          />
        </label>
        <label>
          Subject
          <select value={subject} onChange={(e) => setSubject(e.target.value)}>
            <option value="">All subjects</option>
            {["Physics", "Chemistry", "Mathematics", "Biology"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="learning-grid">
        {chapters
          .filter(
            (c) =>
              (!subject || c.subject === subject) &&
              `${c.title} ${c.notes}`
                .toLowerCase()
                .includes(search.toLowerCase()),
          )
          .map((c) => (
            <article className="card" key={c.id}>
              <span className="pill">{c.subject} · Original guide</span>
              <h2>{c.title}</h2>
              <details>
                <summary>Preview guide</summary>
                <p>{c.notes}</p>
              </details>
              <a
                className="button secondary"
                download={`${c.id}.txt`}
                href={`data:text/plain;charset=utf-8,${encodeURIComponent(c.title + "\n\n" + c.notes + "\n\nStudyCanvas original · CC BY 4.0")}`}
              >
                Download text guide
              </a>
            </article>
          ))}
      </div>
    </>
  );
}
