"use client";
import Link from "next/link";
import { useAuth } from "@/components/providers";
import { firebaseConfigured, browserAuth } from "@/lib/firebase/client";
import { sendEmailVerification, signOut } from "firebase/auth";
import { useState } from "react";
export function Gate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [message, setMessage] = useState("");
  if (loading)
    return (
      <div className="skeleton" role="status">
        Loading your workspace…
      </div>
    );
  if (!firebaseConfigured)
    return (
      <div className="card empty">
        <h1>Your canvas is ready for setup.</h1>
        <p>
          Connect Firebase Authentication and Firestore to save your learning
          profile and daily plan.
        </p>
        <p>This workspace contains no simulated student activity.</p>
        <Link className="button" href="/login">
          Account setup status
        </Link>
      </div>
    );
  if (!user)
    return (
      <div className="card empty">
        <h1>A space of your own.</h1>
        <p>Sign in to open your private learning workspace.</p>
        <Link className="button" href="/login">
          Sign in
        </Link>
      </div>
    );
  if (!user.emailVerified)
    return (
      <div className="card empty">
        <h1>Check your inbox.</h1>
        <p>Verify your email to start saving your learning plan.</p>
        <button
          className="button"
          onClick={() =>
            void sendEmailVerification(user)
              .then(() => setMessage("Verification email sent."))
              .catch(() =>
                setMessage("Please wait before requesting another email."),
              )
          }
        >
          Resend verification
        </button>
        <button
          className="text-link"
          onClick={() => void user.reload().then(() => location.reload())}
        >
          I have verified my email
        </button>
        <button
          className="text-link"
          onClick={() => void signOut(browserAuth())}
        >
          Sign out
        </button>
        <p role="status">{message}</p>
      </div>
    );
  return children;
}
