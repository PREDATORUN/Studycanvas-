"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Orbit,
  LayoutDashboard,
  BookOpen,
  Target,
  ClipboardList,
  MessagesSquare,
  Users,
  Video,
  FolderOpen,
  CalendarDays,
  ChartNoAxesCombined,
  Mail,
  Bell,
  Settings,
  Menu,
  X,
  ArrowUpRight,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
const nav = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "My Learning", href: "/learning", icon: BookOpen },
  { name: "Practice", href: "/practice", icon: Target },
  { name: "Mock Tests", href: "/tests", icon: ClipboardList },
  { name: "Doubt Hub", href: "/doubts", icon: MessagesSquare },
  { name: "Study Communities", href: "/communities", icon: Users },
  { name: "Study Rooms", href: "/rooms", icon: Video },
  { name: "Resources", href: "/resources", icon: FolderOpen },
  { name: "Planner", href: "/planner", icon: CalendarDays },
  { name: "Analytics", href: "/analytics", icon: ChartNoAxesCombined },
  { name: "Messages", href: "/messages", icon: Mail },
  { name: "Notifications", href: "/notifications", icon: Bell },
  { name: "Profile & Settings", href: "/settings", icon: Settings },
];
export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);
  return (
    <div className="workspace">
      <a className="skip" href="#main">
        Skip to content
      </a>
      <aside className={open ? "sidebar open" : "sidebar"}>
        <Link href="/" className="brand">
          <span className="brand-icon">
            <Orbit />
          </span>
          StudyCanvas
        </Link>
        <div className="sidebar-caption">YOUR WORKSPACE</div>
        <nav aria-label="Main navigation">
          {nav.map(({ name, href, icon: Icon }) => (
            <Link
              aria-current={path === href ? "page" : undefined}
              onClick={() => setOpen(false)}
              key={href}
              href={href}
              className={path === href ? "nav-link active" : "nav-link"}
            >
              <Icon size={18} />
              {name}
            </Link>
          ))}
        </nav>
        <div className="sidebar-note">
          <span className="eyebrow">ONE STEP AT A TIME</span>
          <p>
            Consistency makes
            <br />
            room for possibility.
          </p>
          <Link href="/onboarding">
            Set your learning goal <ArrowUpRight size={14} />
          </Link>
        </div>
      </aside>
      {open && (
        <button
          aria-label="Close navigation"
          className="scrim"
          onClick={() => setOpen(false)}
        />
      )}
      <div className="workspace-body">
        <header className="topbar">
          <div className="row">
            <button
              className="icon-button menu-toggle"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen(!open)}
            >
              {open ? <X /> : <Menu />}
            </button>
            <span>
              Workspace <span className="muted"> / </span>{" "}
              <strong>
                {nav.find((n) => n.href === path)?.name ?? "Your journey"}
              </strong>
            </span>
          </div>
          <div className="row">
            <span className="pill">STUDYCANVAS</span>
            <ThemeToggle />
            <Link
              className="avatar"
              href="/settings"
              aria-label="Profile and settings"
            >
              SC
            </Link>
          </div>
        </header>
        <main id="main" className="main-content">
          {children}
        </main>
      </div>
      <nav className="bottom-nav" aria-label="Mobile navigation">
        {nav
          .filter((n) =>
            [
              "/dashboard",
              "/learning",
              "/practice",
              "/planner",
              "/settings",
            ].includes(n.href),
          )
          .map(({ href, name, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={path === href ? "page" : undefined}
            >
              <Icon size={19} />
              <span>{name.replace("Profile & ", "")}</span>
            </Link>
          ))}
      </nav>
    </div>
  );
}
