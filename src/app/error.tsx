"use client";
export default function ErrorBoundary({ reset }: { reset: () => void }) {
  return (
    <main className="auth-page">
      <section className="card empty" role="alert">
        <h1>Something interrupted your canvas.</h1>
        <p>
          Your saved data is held in your account. Try loading this page again.
        </p>
        <button className="button" onClick={reset}>
          Try again
        </button>
      </section>
    </main>
  );
}
