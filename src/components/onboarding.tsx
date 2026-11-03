"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { profileSchema, type Profile } from "@/lib/schemas";
import { api } from "@/services/api";
import { Button } from "@/components/ui/button";

export function Onboarding() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>();
  const [exam, setExam] = useState("JEE Main");
  const [subjects, setSubjects] = useState<string[]>([
    "Physics",
    "Chemistry",
    "Mathematics",
  ]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    api<{ profile: Profile | null }>("profile")
      .then(({ profile }) => {
        if (!active) return;
        setProfile(profile);
        if (profile) {
          setExam(profile.exam);
          setSubjects(profile.subjects);
        }
      })
      .catch((error: Error) => {
        if (active) setMessage(error.message);
      });
    return () => {
      active = false;
    };
  }, []);
  if (profile === undefined)
    return (
      <div role="status" className="card">
        {message || "Loading your preferences…"}
        {message && (
          <button className="text-link" onClick={() => location.reload()}>
            Retry
          </button>
        )}
      </div>
    );
  const availableSubjects =
    exam === "NEET"
      ? ["Physics", "Chemistry", "Biology"]
      : ["Physics", "Chemistry", "Mathematics"];
  return (
    <section className="card onboarding">
      <div className="eyebrow">MAKE IT YOURS</div>
      <h1>What are you working toward?</h1>
      <p>A few details help us shape your learning workspace.</p>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          setMessage("");
          const data = new FormData(event.currentTarget);
          const parsed = profileSchema.safeParse({
            displayName: data.get("displayName"),
            exam,
            grade: data.get("grade"),
            targetYear: Number(data.get("targetYear")),
            subjects,
            goal: data.get("goal"),
          });
          if (!parsed.success) {
            setMessage(
              "Please complete every field and choose at least one subject.",
            );
            setBusy(false);
            return;
          }
          try {
            await api("profile", "PUT", parsed.data);
            router.push("/dashboard");
          } catch (error) {
            setMessage((error as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          Display name
          <input
            name="displayName"
            required
            minLength={2}
            maxLength={60}
            autoComplete="nickname"
            defaultValue={profile?.displayName}
          />
        </label>
        <div className="form-grid">
          <label>
            Your examination
            <select
              name="exam"
              value={exam}
              onChange={(event) => {
                const value = event.target.value;
                setExam(value);
                setSubjects(
                  value === "NEET"
                    ? ["Physics", "Chemistry", "Biology"]
                    : ["Physics", "Chemistry", "Mathematics"],
                );
              }}
            >
              <option>JEE Main</option>
              <option>JEE Advanced</option>
              <option>NEET</option>
            </select>
          </label>
          <label>
            Current class
            <select name="grade" defaultValue={profile?.grade ?? "11"}>
              <option>11</option>
              <option>12</option>
              <option>Other</option>
            </select>
          </label>
        </div>
        <label>
          Target year
          <input
            type="number"
            name="targetYear"
            defaultValue={profile?.targetYear ?? new Date().getFullYear() + 2}
            min={new Date().getFullYear()}
            max={new Date().getFullYear() + 6}
            required
          />
        </label>
        <fieldset>
          <legend>Preferred subjects</legend>
          <div className="subject-choices">
            {availableSubjects.map((subject) => (
              <label key={subject}>
                <input
                  type="checkbox"
                  checked={subjects.includes(subject)}
                  onChange={(event) =>
                    setSubjects((current) =>
                      event.target.checked
                        ? [...current, subject]
                        : current.filter((item) => item !== subject),
                    )
                  }
                />
                {subject}
              </label>
            ))}
          </div>
        </fieldset>
        <label>
          Your learning goal
          <textarea
            name="goal"
            placeholder="Build a strong understanding, one chapter at a time."
            required
            minLength={3}
            maxLength={300}
            defaultValue={profile?.goal}
          />
        </label>
        <p className="muted">
          No phone number, date of birth, or school address required.
        </p>
        <Button disabled={busy}>{busy ? "Saving…" : "Open my canvas →"}</Button>
        <p role="status">{message}</p>
      </form>
    </section>
  );
}
