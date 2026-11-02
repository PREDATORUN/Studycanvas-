import Link from "next/link";
export default function NotFound() {
  return (
    <main className="auth-page">
      <section className="card empty">
        <h1>This page is still a blank canvas.</h1>
        <p>We couldn’t find that destination.</p>
        <Link className="button" href="/dashboard">
          Go to dashboard
        </Link>
      </section>
    </main>
  );
}
