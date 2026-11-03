"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { browserAuth, firebaseConfigured } from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";
export function AuthForm({ initialMode = "login" }: { initialMode?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function run(action: () => Promise<void>) {
    setBusy(true);
    setMessage("");
    try {
      await action();
    } catch {
      setMessage(
        "Unable to complete sign-in. Check your details, connection, and Firebase configuration.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-card card">
      <Link className="eyebrow" href="/">
        ← STUDYCANVAS
      </Link>
      <h1>{mode === "register" ? "Your next chapter." : "Welcome back."}</h1>
      <p>
        {mode === "register"
          ? "Create your private learning workspace."
          : "A little focus goes a long way."}
      </p>
      {!firebaseConfigured && (
        <div className="notice" role="status">
          Account services need Firebase configuration. No account will be
          created until setup is complete.
        </div>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void run(async () => {
            const auth = browserAuth();
            const result =
              mode === "register"
                ? await createUserWithEmailAndPassword(auth, email, password)
                : await signInWithEmailAndPassword(auth, email, password);
            if (mode === "register") await sendEmailVerification(result.user);
            router.push("/dashboard");
          });
        }}
      >
        <label>
          Email
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            maxLength={254}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            autoComplete={
              mode === "register" ? "new-password" : "current-password"
            }
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            maxLength={128}
          />
        </label>
        <Button disabled={busy || !firebaseConfigured}>
          {busy
            ? "Please wait…"
            : mode === "register"
              ? "Create account"
              : "Sign in"}
        </Button>
      </form>
      <button
        className="secondary button"
        disabled={busy || !firebaseConfigured}
        onClick={() =>
          void run(async () => {
            await signInWithPopup(browserAuth(), new GoogleAuthProvider());
            router.push("/dashboard");
          })
        }
      >
        Continue with Google
      </button>
      <button
        className="text-link"
        disabled={busy || !firebaseConfigured || !email}
        onClick={() =>
          void run(async () => {
            await sendPasswordResetEmail(browserAuth(), email);
            setMessage(
              "If this address has an account, a reset email will arrive shortly.",
            );
          })
        }
      >
        Reset password
      </button>
      <p>
        <button
          className="text-link"
          onClick={() => setMode(mode === "login" ? "register" : "login")}
        >
          {mode === "login"
            ? "New here? Create an account"
            : "Already registered? Sign in"}
        </button>
      </p>
      <div role="status">{message}</div>
      <small>
        Student accounts are private. Teacher and administrator access cannot be
        selected at registration.
      </small>
    </div>
  );
}
