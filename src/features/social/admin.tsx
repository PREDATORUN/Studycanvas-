"use client";
import { useEffect, useState } from "react";
import { api } from "@/services/api";
export function Admin() {
  const [items, setItems] = useState<
    { id: string; targetId: string; reason: string }[]
  >([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    api<{ items: typeof items }>("admin")
      .then((d) => setItems(d.items))
      .catch((e) => setError(e.message));
  }, []);
  async function action(data: unknown) {
    setBusy(true);
    try {
      await api("admin", "POST", data);
      setItems((await api<{ items: typeof items }>("admin")).items);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <h1>Moderation workspace</h1>
      <p>
        Trusted administrator access and a recent sign-in are required for
        changes.
      </p>
      <p role="alert">{error}</p>
      {items.map((item) => (
        <article className="card" key={item.id}>
          <h2>Report: {item.targetId}</h2>
          <p>{item.reason}</p>
          <button
            className="button secondary"
            disabled={busy}
            onClick={() => void action({ action: "resolve", id: item.id })}
          >
            Mark resolved
          </button>
        </article>
      ))}
      <form
        className="card"
        onSubmit={(e) => {
          e.preventDefault();
          const d = new FormData(e.currentTarget);
          if (confirm("Apply this administrative change?"))
            void action({ action: d.get("action"), id: d.get("id") });
        }}
      >
        <label>
          Action
          <select name="action">
            <option value="closeSpace">Close space</option>
            <option value="removeDoubt">Remove doubt and answers</option>
            <option value="approveTeacher">Approve teacher access</option>
          </select>
        </label>
        <label>
          Exact space/doubt ID or teacher UID
          <input name="id" required />
        </label>
        <button className="button" disabled={busy}>
          Apply change
        </button>
      </form>
    </>
  );
}
