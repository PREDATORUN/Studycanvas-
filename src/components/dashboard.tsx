"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  Check,
  Plus,
  Target,
  BookOpen,
  CalendarDays,
  Clock3,
} from "lucide-react";
import { api } from "@/services/api";
import type { Profile, Task } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
export function Dashboard() {
  const [profile, setProfile] = useState<Profile | null>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    Promise.all([
      api<{ profile: Profile | null }>("profile"),
      api<{ tasks: Task[] }>("tasks"),
    ])
      .then(([p, t]) => {
        if (active) {
          setProfile(p.profile);
          setTasks(t.tasks);
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, []);
  async function refresh() {
    const result = await api<{ tasks: Task[] }>("tasks");
    setTasks(result.tasks);
  }
  if (error && profile === undefined)
    return (
      <div role="alert" className="notice">
        {error} <button onClick={() => location.reload()}>Retry</button>
      </div>
    );
  if (profile === undefined)
    return (
      <div className="skeleton" role="status">
        Loading your learning plan…
      </div>
    );
  if (!profile)
    return (
      <div className="card empty">
        <h1>Let’s give your ambition a plan.</h1>
        <p>Choose your examination and set your first learning goal.</p>
        <Link className="button" href="/onboarding">
          Personalize my workspace →
        </Link>
      </div>
    );
  const completed = tasks.filter((t) => t.completed).length;
  const progress = tasks.length
    ? Math.round((completed / tasks.length) * 100)
    : 0;
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}{" "}
            · {profile.exam}
          </div>
          <h1>
            Make today count, {profile.displayName.split(" ")[0]}
            <span className="accent">.</span>
          </h1>
          <p>A clear mind. A small step. A little closer to your goal.</p>
        </div>
        <Link className="secondary button" href="/onboarding">
          Edit learning goal <ArrowUpRight size={16} />
        </Link>
      </div>
      <section className="goal-banner">
        <div>
          <span className="pill">YOUR NORTH STAR</span>
          <h2>{profile.goal}</h2>
          <p>
            Class {profile.grade} · Target {profile.targetYear} · Your pace,
            your progress.
          </p>
        </div>
        <div className="orbit-art" aria-hidden="true">
          <Target size={100} strokeWidth={1} />
        </div>
      </section>
      <section className="stats-grid">
        {[
          {
            label: "Plan completion",
            value: `${progress}%`,
            detail: `${completed} of ${tasks.length} loaded tasks`,
            icon: CalendarDays,
          },
          {
            label: "Practice questions",
            value: "—",
            detail: "Practice arrives in milestone 2",
            icon: Target,
          },
          {
            label: "Mock performance",
            value: "—",
            detail: "No test attempts yet",
            icon: BookOpen,
          },
          {
            label: "Study activity",
            value: "—",
            detail: "Session tracking coming later",
            icon: Clock3,
          },
        ].map(({ label, value, detail, icon: Icon }) => (
          <article className="card stat" key={label}>
            <div className="row spread">
              <span>{label}</span>
              <Icon className="accent" size={19} />
            </div>
            <strong>{value}</strong>
            <small>{detail}</small>
          </article>
        ))}
      </section>
      <div className="dashboard-grid">
        <section className="card plan-card">
          <div className="row spread">
            <div>
              <span className="eyebrow">A LITTLE STRUCTURE</span>
              <h2>Your study plan</h2>
            </div>
            <span className="pill">
              {completed}/{tasks.length} done
            </span>
          </div>
          <p>Pick something achievable. Leave room for breaks.</p>
          <form
            className="task-form"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError("");
              try {
                await api("tasks", "POST", { title });
                setTitle("");
                await refresh();
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <label className="sr-only" htmlFor="new-task">
              New study task
            </label>
            <input
              id="new-task"
              placeholder="What’s your next small step?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={160}
            />
            <Button aria-label="Add task" disabled={busy}>
              <Plus size={18} />
            </Button>
          </form>
          <div role="alert">{error}</div>
          <ul className="task-list">
            {tasks.map((task) => (
              <li key={task.id}>
                <button
                  className={
                    task.completed ? "task-check checked" : "task-check"
                  }
                  aria-label={`${task.completed ? "Reopen" : "Complete"} ${task.title}`}
                  aria-pressed={task.completed}
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    setError("");
                    try {
                      await api("tasks", "PATCH", {
                        id: task.id,
                        completed: !task.completed,
                      });
                      await refresh();
                    } catch (e) {
                      setError((e as Error).message);
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  {task.completed && <Check size={14} />}
                </button>
                <span className={task.completed ? "done" : ""}>
                  {task.title}
                </span>
              </li>
            ))}
          </ul>
          {!tasks.length && (
            <div className="small-empty">
              <CalendarDays size={28} />
              <h3>A fresh page.</h3>
              <p>
                Add your first task above. Your plan saves privately to your
                account.
              </p>
            </div>
          )}
          <small>
            Showing the latest 100 tasks. Completion is based on the tasks
            shown.
          </small>
        </section>
        <aside className="card">
          <span className="eyebrow">THE BIGGER PICTURE</span>
          <h2>Your subjects</h2>
          <p>Understanding starts with a strong foundation.</p>
          {profile.subjects.map((subject, i) => (
            <div className="subject" key={subject}>
              <span className={`subject-icon s${i}`}>
                <BookOpen size={19} />
              </span>
              <div>
                <strong>{subject}</strong>
                <small>No chapter activity recorded</small>
              </div>
              <ArrowUpRight size={16} />
            </div>
          ))}
          <div className="notice">
            Chapter progress and recommendations will activate with the learning
            engine in milestone 2.
          </div>
        </aside>
      </div>
      <section className="card activity-empty">
        <div>
          <span className="eyebrow">YOUR LEARNING RHYTHM</span>
          <h2>Every session will tell a story.</h2>
          <p>
            Weekly activity charts will appear once session tracking is
            available. We never fill your chart with invented activity.
          </p>
        </div>
        <BookOpen size={48} className="accent" aria-hidden="true" />
      </section>
    </>
  );
}
