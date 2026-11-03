"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/services/api";
type Plan = {
  id: string;
  title: string;
  date: string;
  subject: string;
  minutes: number;
  completed: boolean;
};
export function Planner() {
  const [items, setItems] = useState<Plan[]>([]);
  const [day, setDay] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    return (await api<{ items: Plan[] }>("planner")).items;
  }, []);
  useEffect(() => {
    let active = true;
    load()
      .then((items) => {
        if (active) setItems(items);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [load]);
  async function action(data: unknown) {
    setBusy(true);
    try {
      await api("planner", "POST", data);
      setItems(await load());
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <h1>A plan you can adjust.</h1>
      <p>
        Schedule focused sessions and breaks. Completion reflects your own
        checkmarks, not tracked study time.
      </p>
      <p role="alert">{error}</p>
      <section className="card">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const d = new FormData(e.currentTarget);
            await action({
              action: "create",
              title: d.get("title"),
              date: d.get("date"),
              subject: d.get("subject"),
              minutes: Number(d.get("minutes")),
            });
          }}
        >
          <div className="form-grid">
            <label>
              Task or break
              <input name="title" maxLength={160} required />
            </label>
            <label>
              Date
              <input type="date" name="date" required />
            </label>
            <label>
              Subject
              <select name="subject">
                {[
                  "Physics",
                  "Chemistry",
                  "Mathematics",
                  "Biology",
                  "Break",
                  "Other",
                ].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label>
              Minutes
              <input
                type="number"
                name="minutes"
                min={5}
                max={180}
                defaultValue={30}
              />
            </label>
          </div>
          <button className="button" disabled={busy}>
            Schedule
          </button>
        </form>
      </section>
      <label>
        Filter by date
        <input
          type="date"
          value={day}
          onChange={(e) => setDay(e.target.value)}
        />
      </label>
      <div className="learning-grid">
        {items
          .filter((i) => !day || i.date === day)
          .map((item) => (
            <article className="card" key={item.id}>
              <span className="pill">
                {item.date} · {item.subject}
              </span>
              <h2>{item.title}</h2>
              <p>{item.minutes} planned minutes</p>
              <label className="answer-option">
                <input
                  type="checkbox"
                  checked={item.completed}
                  disabled={busy}
                  onChange={(e) =>
                    void action({
                      action: "complete",
                      id: item.id,
                      completed: e.target.checked,
                    })
                  }
                />
                Completed
              </label>
              <button
                className="text-link"
                disabled={busy}
                onClick={() => void action({ action: "remove", id: item.id })}
              >
                Remove
              </button>
            </article>
          ))}
      </div>
      {!items.length && (
        <p>No scheduled tasks. Start with something achievable.</p>
      )}
    </>
  );
}
