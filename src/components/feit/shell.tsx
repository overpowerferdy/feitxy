import type { MouseEvent, ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { BookOpen, Check, Dumbbell, HeartPulse, Home, ListChecks, NotebookPen, Settings, X } from "lucide-react";
import logo from "@/assets/fittrack-logo.png";
import { Button } from "@/components/ui/button";
import { useFeit } from "@/lib/feit-store";

const main = [
  { to: "/", label: "Today", icon: Home, match: ["/"] },
  { to: "/workouts", label: "Train", icon: Dumbbell, match: ["/workouts", "/progress"] },
  { to: "/wellness", label: "Body", icon: HeartPulse, match: ["/wellness"] },
  { to: "/learning", label: "Learn", icon: BookOpen, match: ["/learning", "/learn"] },
  { to: "/journal", label: "Journal", icon: NotebookPen, match: ["/journal"] },
] as const;

const extra = [
  { to: "/habits", label: "Routine", icon: ListChecks, match: ["/habits"] },
  { to: "/settings", label: "Settings", icon: Settings, match: ["/settings"] },
] as const;

function isActive(path: string, match: readonly string[]) {
  return match.some((m) => (m === "/" ? path === "/" : path === m || path.startsWith(`${m}/`)));
}

export function Shell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { notice, notify, focus } = useFeit();
  // Focus mode temporarily owns navigation; links stay visible but cannot be used.
  const locked = !!focus;
  const guard = (event: MouseEvent) => { if (locked) event.preventDefault(); };
  const lockClass = locked ? "pointer-events-none opacity-50" : "";
  return (
    <div className="min-h-screen bg-background">
      <aside className="feit-sidebar" aria-label="Main navigation">
        <Link to="/" onClick={guard} aria-disabled={locked || undefined} tabIndex={locked ? -1 : undefined} className={`flex items-center gap-3 px-2 pb-6 ${lockClass}`}>
          <img src={logo} alt="Feit logo" width={40} height={40} className="size-10 rounded-xl" />
          <div><p className="text-lg font-extrabold leading-none">Feit</p><p className="mt-1 text-xs text-sidebar-foreground/65">Small steps, strong habits</p></div>
        </Link>
        <nav className="grid gap-1">
          {[...main, ...extra].map(({ to, label, icon: Icon, match }) => (
            <Link key={to} to={to} onClick={guard} aria-disabled={locked || undefined} tabIndex={locked ? -1 : undefined} aria-current={isActive(path, match) ? "page" : undefined} className={`feit-side-link ${isActive(path, match) ? "is-active" : ""} ${lockClass}`}>
              <Icon size={19} strokeWidth={2} /><span>{label}</span>
            </Link>
          ))}
        </nav>
        <p className="mt-auto rounded-xl border border-sidebar-border bg-sidebar-accent/50 p-3 text-xs leading-relaxed text-sidebar-foreground/75">Keep showing up. Progress grows from the small things you repeat.</p>
      </aside>

      <header className="feit-topbar">
        <Link to="/" onClick={guard} aria-disabled={locked || undefined} tabIndex={locked ? -1 : undefined} className={`flex items-center gap-2 ${lockClass}`}><img src={logo} alt="Feit logo" width={32} height={32} className="size-8 rounded-lg" /><span className="text-lg font-extrabold">Feit</span></Link>
        <div className="flex items-center gap-1">
          <Link to="/habits" onClick={guard} aria-disabled={locked || undefined} tabIndex={locked ? -1 : undefined} aria-label="Daily routine" className={`feit-icon-link ${lockClass}`}><ListChecks size={20} /></Link>
          <Link to="/settings" onClick={guard} aria-disabled={locked || undefined} tabIndex={locked ? -1 : undefined} aria-label="Settings" className={`feit-icon-link ${lockClass}`}><Settings size={20} /></Link>
        </div>
      </header>

      <main className="feit-main">
        <div key={path} className="feit-view mx-auto w-full max-w-[760px] px-4 xl:max-w-[960px] pb-28 pt-4 sm:px-6 sm:pt-8 lg:pb-12">{children}</div>
      </main>

      <nav className="feit-bottom-nav" aria-label="Main navigation">
        {main.map(({ to, label, icon: Icon, match }) => (
          <Link key={to} to={to} onClick={guard} aria-disabled={locked || undefined} tabIndex={locked ? -1 : undefined} aria-current={isActive(path, match) ? "page" : undefined} className={`feit-bottom-link ${isActive(path, match) ? "is-active" : ""} ${lockClass}`}>
            <Icon size={21} strokeWidth={2} /><span>{label}</span>
          </Link>
        ))}
      </nav>

      {notice && (
        <div role="status" className="feit-toast fixed inset-x-4 bottom-24 z-50 mx-auto flex max-w-sm items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm shadow-lg lg:bottom-6 lg:left-auto lg:right-6 lg:mx-0">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-primary"><Check size={16} /></span>
          <span className="flex-1">{notice}</span>
          <Button variant="ghost" size="icon" className="size-7" onClick={() => notify("")} aria-label="Dismiss"><X size={15} /></Button>
        </div>
      )}
    </div>
  );
}

export function SubTabs({ items }: { items: { to: string; label: string; icon: typeof Home }[] }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="feit-segmented mb-5" aria-label="Sections">
      {items.map(({ to, label, icon: Icon }) => (
        <Link key={to} to={to} aria-current={path === to ? "page" : undefined} className={`feit-segment ${path === to ? "is-active" : ""}`}><Icon size={16} /><span>{label}</span></Link>
      ))}
    </nav>
  );
}
