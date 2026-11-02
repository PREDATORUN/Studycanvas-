"use client";
import { signOut } from "firebase/auth";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { browserAuth } from "@/lib/firebase/client";
import { useAuth } from "@/components/providers";
import { api } from "@/services/api";
export function Settings() {
  const { user } = useAuth();
  const router = useRouter();
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <section className="card onboarding">
      <div className="eyebrow">YOUR ACCOUNT</div>
      <h1>Private by default.</h1>
      <p>{user?.email}</p>
      <p>
        Your profile and tasks are visible only to your account. New accounts
        have the student role.
      </p>
      <button
        className="button secondary"
        onClick={() =>
          void signOut(browserAuth()).then(() => router.push("/login"))
        }
      >
        Sign out
      </button>
      <hr />
      <h2>Delete account</h2>
      <p>
        This permanently deletes your profile, tasks, and Firebase login. Sign
        in again immediately before deleting.
      </p>
      <label>
        Type DELETE to confirm
        <input
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="off"
        />
      </label>
      <button
        className="button danger"
        disabled={confirm !== "DELETE" || busy}
        onClick={async () => {
          setBusy(true);
          try {
            await api("account", "DELETE");
            await signOut(browserAuth());
            router.push("/");
          } catch (e) {
            setMessage((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        Permanently delete account
      </button>
      <p role="alert">{message}</p>
    </section>
  );
}
