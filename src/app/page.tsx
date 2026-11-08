import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Orbit,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { AppearanceButton } from "@/components/liquid-glass/appearance";
export default function Home() {
  return (
    <main className="landing">
      <header className="landing-nav">
        <Link href="/" className="brand">
          <span className="brand-icon">
            <Orbit />
          </span>
          StudyCanvas<span className="pill">EARLY ACCESS</span>
        </Link>
        <div className="row">
          <AppearanceButton />
          <ThemeToggle />
          <Link href="/login">Sign in</Link>
        </div>
      </header>
      <section className="hero">
        <div className="eyebrow">
          <Sparkles size={15} /> YOUR AMBITION. A CLEARER CANVAS.
        </div>
        <h1>
          Big dreams.
          <br />
          <span>A little more focus.</span>
        </h1>
        <p>
          Your space to learn deeply, build a steady rhythm, and take the next
          step toward JEE or NEET.
        </p>
        <div className="row">
          <Button asChild>
            <Link href="/login?mode=register">
              Start your canvas <ArrowRight size={18} />
            </Link>
          </Button>
          <Link className="text-link" href="/dashboard">
            Explore the workspace ↗
          </Link>
        </div>
        <div className="trust">
          <ShieldCheck size={16} /> Private by default · Free student-first
          foundation
        </div>
      </section>
      <section className="landing-cards">
        <article className="card">
          <BookOpen className="accent" />
          <h2>One place. More clarity.</h2>
          <p>
            A personal dashboard and a simple daily plan to keep your attention
            on what matters.
          </p>
        </article>
        <article className="card">
          <Orbit className="accent" />
          <h2>Built around your journey.</h2>
          <p>
            Choose your examination, subjects, and goals. Make the workspace
            yours.
          </p>
        </article>
        <article className="card">
          <Sparkles className="accent" />
          <h2>Growing with intention.</h2>
          <p>
            Original practice and starter guides are ready. Collaboration is
            coming in the next milestones. See exactly what is ready.
          </p>
        </article>
      </section>
      <footer>
        StudyCanvas <span>Built for the work behind the breakthrough.</span>
      </footer>
    </main>
  );
}
