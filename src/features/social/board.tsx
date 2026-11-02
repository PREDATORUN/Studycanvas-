"use client";
import { useCallback, useEffect, useState } from "react";
import {
  collection,
  doc,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  limit,
} from "firebase/firestore";
import { browserAuth } from "@/lib/firebase/client";
import { api } from "@/services/api";
type Item = {
  id: string;
  title?: string;
  text?: string;
  subject?: string;
  name?: string;
  acceptedId?: string;
  canAccept?: boolean;
  votes?: number;
  kind?: string;
  description?: string;
  private?: boolean;
  member?: boolean;
  invited?: boolean;
  owner?: boolean;
  closed?: boolean;
  count?: number;
  notes?: string;
  read?: boolean;
  href?: string;
};
export function Board({
  kind,
}: {
  kind:
    | "doubts"
    | "communities"
    | "rooms"
    | "messages"
    | "notifications"
    | "teacher";
}) {
  const [items, setItems] = useState<Item[]>([]);
  const [selected, setSelected] = useState<Item | null>(null);
  const [entries, setEntries] = useState<Item[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState("");
  const [live, setLive] = useState("");
  const queryKind =
    kind === "notifications"
      ? "notifications"
      : kind === "doubts"
        ? "doubts"
        : "spaces";
  const refresh = useCallback(
    () => api<{ items: Item[] }>(`social?kind=${queryKind}`),
    [queryKind],
  );
  useEffect(() => {
    let active = true;
    refresh()
      .then((d) => {
        if (active) setItems(d.items);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [refresh]);
  useEffect(() => {
    if (!selected) return;
    if (kind === "doubts") {
      let active = true;
      api<{ items: Item[] }>(`social?kind=answers&id=${selected.id}`)
        .then((d) => {
          if (active) setEntries(d.items);
        })
        .catch((e) => setError(e.message));
      return () => {
        active = false;
      };
    }
    if (!selected.member) return;
    const auth = browserAuth();
    const db = getFirestore(auth.app);
    const stopPosts = onSnapshot(
      query(
        collection(db, `spaces/${selected.id}/posts`),
        orderBy("createdAt", "desc"),
        limit(50),
      ),
      (snap) => {
        setEntries(snap.docs.map((d) => ({ id: d.id, ...d.data() })).reverse());
        setLive("Connected · latest 50 messages");
      },
      () =>
        setLive(
          "Live connection unavailable. Check Firebase rules and membership.",
        ),
    );
    const stopSpace = onSnapshot(
      doc(db, `spaces/${selected.id}`),
      (snap) => {
        if (snap.exists()) setNotes(snap.data().notes ?? "");
      },
      () => {},
    );
    return () => {
      stopPosts();
      stopSpace();
    };
  }, [selected, kind]);
  async function act(data: unknown) {
    setBusy(true);
    setError("");
    try {
      await api("social", "POST", data);
      const refreshed = await refresh();
      setItems(refreshed.items);
      setSelected((old) =>
        old ? (refreshed.items.find((i) => i.id === old.id) ?? null) : null,
      );
      if (selected && kind === "doubts") {
        const d = await api<{ items: Item[] }>(
          `social?kind=answers&id=${selected.id}`,
        );
        setEntries(d.items);
      }
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  const titles = {
    doubts: "Doubt Hub",
    communities: "Study communities",
    rooms: "Study rooms",
    messages: "Group messages",
    notifications: "Notifications",
    teacher: "Teacher classes",
  };
  const visible = items
    .filter(
      (i) =>
        kind === "doubts" ||
        kind === "notifications" ||
        (kind === "rooms"
          ? i.kind === "room"
          : kind === "teacher"
            ? i.kind === "class"
            : kind === "messages"
              ? i.member
              : i.kind === "community"),
    )
    .filter((i) =>
      `${i.title ?? ""} ${i.text ?? ""}`
        .toLowerCase()
        .includes(search.toLowerCase()),
    );
  return (
    <>
      <div className="eyebrow">YOUR STUDY COMMUNITY</div>
      <h1>{titles[kind]}</h1>
      <p>
        {kind === "messages"
          ? "Messages stay within spaces you joined. Direct unsolicited messaging is unavailable."
          : kind === "rooms"
            ? "Live text chat and shared notes. Voice, video and recording are unavailable."
            : "Private contact details are never listed. Keep discussions educational."}
      </p>
      <p role="alert">{error}</p>
      <label>
        Search loaded items
        <input value={search} onChange={(e) => setSearch(e.target.value)} />
      </label>
      {!["messages", "notifications"].includes(kind) && (
        <details>
          <summary>
            {kind === "doubts" ? "Post a doubt" : "Create a space"}
          </summary>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget);
              await act(
                kind === "doubts"
                  ? {
                      action: "doubt",
                      title: data.get("title"),
                      text: data.get("text"),
                      subject: data.get("subject"),
                    }
                  : {
                      action: "space",
                      title: data.get("title"),
                      description: data.get("text"),
                      kind:
                        kind === "rooms"
                          ? "room"
                          : kind === "teacher"
                            ? "class"
                            : "community",
                      private: data.get("private") === "on",
                    },
              );
            }}
          >
            <label>
              Title
              <input name="title" required minLength={5} maxLength={80} />
            </label>
            <label>
              Description or question
              <textarea name="text" minLength={2} maxLength={3000} required />
            </label>
            {kind === "doubts" ? (
              <label>
                Subject
                <select name="subject">
                  {["Physics", "Chemistry", "Mathematics", "Biology"].map(
                    (s) => (
                      <option key={s}>{s}</option>
                    ),
                  )}
                </select>
              </label>
            ) : (
              <label className="answer-option">
                <input type="checkbox" name="private" />
                Invitation only
              </label>
            )}
            <button className="button" disabled={busy}>
              Create
            </button>
          </form>
        </details>
      )}
      <div className="learning-grid">
        {visible.map((item) => (
          <article className="card" key={item.id}>
            <span className="pill">
              {item.subject ?? item.kind ?? "Update"}
              {item.closed ? " · closed" : ""}
            </span>
            <h2>{item.title ?? item.text}</h2>
            <p>{item.description ?? (item.title ? item.text : "")}</p>
            {kind === "notifications" ? (
              <button
                className="button secondary"
                disabled={item.read || busy}
                onClick={() => void act({ action: "read", id: item.id })}
              >
                {item.read ? "Read" : "Mark read"}
              </button>
            ) : (
              <>
                <button
                  className="button secondary"
                  onClick={() => {
                    setSelected(item);
                    setEntries([]);
                    setNotes(item.notes ?? "");
                  }}
                >
                  Open
                </button>
                {item.kind &&
                  !item.member &&
                  (!item.private || item.invited) &&
                  !item.closed && (
                    <button
                      className="text-link"
                      disabled={busy}
                      onClick={() => void act({ action: "join", id: item.id })}
                    >
                      Join
                    </button>
                  )}
              </>
            )}
          </article>
        ))}
      </div>
      {!visible.length && (
        <div className="card empty">
          No items yet. Your community starts with a useful conversation.
        </div>
      )}
      {selected && (
        <section className="card" style={{ marginTop: 24 }}>
          <h2>{selected.title}</h2>
          <p>{selected.text ?? selected.description}</p>
          <p role="status">{live}</p>
          {entries.map((entry) => (
            <article key={entry.id} className="notice">
              <strong>{entry.name ?? "Student"}</strong>
              {selected.acceptedId === entry.id && (
                <span className="pill">Accepted solution</span>
              )}
              <p style={{ whiteSpace: "pre-wrap" }}>{entry.text}</p>
              {kind === "doubts" && (
                <div className="row">
                  <button
                    disabled={busy}
                    className="text-link"
                    onClick={() =>
                      void act({
                        action: "vote",
                        id: selected.id,
                        answerId: entry.id,
                      })
                    }
                  >
                    Helpful ({entry.votes ?? 0})
                  </button>
                  {selected.canAccept && (
                    <button
                      disabled={busy}
                      className="text-link"
                      onClick={() =>
                        void act({
                          action: "accept",
                          id: selected.id,
                          answerId: entry.id,
                        })
                      }
                    >
                      Accept solution
                    </button>
                  )}
                </div>
              )}
            </article>
          ))}
          {(kind === "doubts" || (selected.member && !selected.closed)) && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const data = new FormData(form);
                const success = await act(
                  kind === "doubts"
                    ? {
                        action: "answer",
                        id: selected.id,
                        text: data.get("text"),
                      }
                    : {
                        action: "post",
                        id: selected.id,
                        text: data.get("text"),
                        announcement: data.get("announcement") === "on",
                      },
                );
                if (success) form.reset();
              }}
            >
              <label>
                {kind === "doubts" ? "Your explanation" : "Message"}
                <textarea name="text" required minLength={2} maxLength={3000} />
              </label>
              {selected.owner && (
                <label className="answer-option">
                  <input type="checkbox" name="announcement" />
                  Announcement
                </label>
              )}
              <button disabled={busy} className="button">
                Post
              </button>
            </form>
          )}
          {selected.kind === "room" && selected.member && !selected.closed && (
            <>
              <label>
                Shared agenda and notes
                <textarea
                  value={notes}
                  maxLength={3000}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </label>
              <button
                className="button secondary"
                disabled={busy}
                onClick={() =>
                  void act({ action: "notes", id: selected.id, text: notes })
                }
              >
                Save shared notes
              </button>
              <small>
                Changes use the latest saved text; coordinate edits with your
                group.
              </small>
            </>
          )}
          {selected.owner && !selected.closed && (
            <>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const data = new FormData(e.currentTarget);
                  void act({
                    action: "invite",
                    id: selected.id,
                    uid: data.get("uid"),
                  });
                }}
              >
                <label>
                  Invite an existing account by UID
                  <input name="uid" required />
                </label>
                <button className="button secondary" disabled={busy}>
                  Add member
                </button>
              </form>
              <button
                className="text-link"
                disabled={busy}
                onClick={() => void act({ action: "close", id: selected.id })}
              >
                Close this space
              </button>
            </>
          )}
          {selected.member && !selected.owner && (
            <button
              className="text-link"
              disabled={busy}
              onClick={async () => {
                await act({ action: "leave", id: selected.id });
                setSelected(null);
              }}
            >
              Leave space
            </button>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget);
              void act({
                action: "report",
                id: selected.id,
                reason: data.get("reason"),
              });
            }}
          >
            <label>
              Report a concern
              <input name="reason" minLength={2} maxLength={3000} required />
            </label>
            <button className="text-link" disabled={busy}>
              Submit report
            </button>
          </form>
          <button className="text-link" onClick={() => setSelected(null)}>
            Close panel
          </button>
        </section>
      )}
    </>
  );
}
