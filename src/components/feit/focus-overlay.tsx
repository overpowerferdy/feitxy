import { useEffect, useState } from "react";
import { CheckCircle2, Clock3, Lock, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExerciseCard, exerciseKey } from "@/components/feit/workout-exercise-card";
import { parseSets, workoutDayComplete } from "@/lib/fittrack-data";
import { fmtDate, useFeit, type FocusSession } from "@/lib/feit-store";
import { useWorkoutSession } from "@/lib/use-workout-session";

function clock(seconds: number) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function FocusOverlay() {
  const { focus } = useFeit();
  if (!focus) return null;
  return <FocusSessionOverlay key={`${focus.date}-${focus.startedAt}`} focus={focus} />;
}

function FocusSessionOverlay({ focus }: { focus: FocusSession }) {
  const { data, endFocus, notify } = useFeit();
  const session = useWorkoutSession(focus.date);
  const [, tick] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => tick((n) => n + 1), 500);
    return () => window.clearInterval(timer);
  }, []);

  // Focus mode owns navigation: Back, Escape and the tab bar are blocked until it ends.
  useEffect(() => {
    const blockEscape = (event: KeyboardEvent) => { if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); } };
    const blockBack = () => window.history.pushState(null, "", window.location.href);
    window.history.pushState(null, "", window.location.href);
    window.addEventListener("keydown", blockEscape, true);
    window.addEventListener("popstate", blockBack);
    return () => { window.removeEventListener("keydown", blockEscape, true); window.removeEventListener("popstate", blockBack); };
  }, []);

  const remaining = Math.max(0, focus.endsAt - Date.now()) / 1000;
  const allLogged = workoutDayComplete(data, focus.date);
  const canFinish = remaining <= 0 || allLogged;
  const timeProgress = Math.min(100, Math.round(((focus.durationSec - remaining) / focus.durationSec) * 100));
  const setsProgress = session.totalSets ? Math.min(100, Math.round((session.loggedSets / session.totalSets) * 100)) : 0;
  const endsAt = new Date(focus.endsAt).toLocaleTimeString("en", { hour: "numeric", minute: "2-digit" });

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-background" role="dialog" aria-modal="true" aria-label="Focus mode">
      <div className="mx-auto max-w-3xl space-y-4 p-4 pb-32 sm:p-6">
        <header className="sticky top-0 z-10 rounded-2xl border border-border bg-card/95 p-4 backdrop-blur">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-primary"><Lock size={13} />Focus mode</p>
              <h2 className="mt-1 text-2xl font-extrabold">{session.plan.title}</h2>
              <p className="text-sm text-muted-foreground">{fmtDate(focus.date, { weekday: "long", month: "long", day: "numeric" })}</p>
            </div>
            <div className="text-right">
              <p className={`text-3xl font-extrabold tabular-nums ${remaining <= 0 ? "text-primary" : ""}`}>{remaining <= 0 ? "Done" : clock(remaining)}</p>
              <p className="text-xs text-muted-foreground">{remaining <= 0 ? "Timer finished" : `ends ${endsAt}`}</p>
            </div>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <div>
              <p className="flex items-center justify-between text-xs font-bold"><span className="flex items-center gap-1"><Clock3 size={12} />Focus timer</span><span className="tabular-nums">{timeProgress}%</span></p>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${timeProgress}%` }} /></div>
            </div>
            <div>
              <p className="flex items-center justify-between text-xs font-bold"><span className="flex items-center gap-1"><Timer size={12} />Workout logs</span><span className="tabular-nums">{session.loggedSets}/{session.totalSets || session.visible.length}</span></p>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-accent transition-all" style={{ width: `${session.totalSets ? setsProgress : allLogged ? 100 : 0}%` }} /></div>
            </div>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground" aria-live="polite">
            {allLogged ? "All workouts for this day are logged — you can finish now." : remaining <= 0 ? "Timer finished — you can finish now. Log anything still left if you can." : `Stay here until the timer ends or every set for this day is logged.`}
          </p>
        </header>

        <div className="feit-stagger grid gap-4 sm:grid-cols-2">
          {session.visible.map(({ ex, from }) => {
            const checked = session.done.includes(ex);
            const origin = from ?? focus.date;
            return <ExerciseCard key={ex} ex={ex} checked={checked} canCheck={session.isWorkout} onToggle={() => session.toggle(ex)} movedFrom={from} onMoveBack={from ? () => session.moveExercise(ex, from, from) : undefined} logged={session.setsLog[ex]} weights={session.weightsLog[ex]} videoId={session.data.videoLinks[exerciseKey(ex)]} onSaveVideo={(id) => session.saveVideo(ex, id)} onLog={session.canTrack ? (next, nextWeights) => session.logSets(ex, next, nextWeights, parseSets(ex.split(" · ")[1])?.count) : undefined} />;
          })}
        </div>

        <div className="fixed inset-x-0 bottom-0 border-t border-border bg-card/95 p-4 backdrop-blur">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold">{canFinish ? "Ready when you are." : `${clock(remaining)} left · ${session.totalSets - session.loggedSets} sets to log`}</p>
              <p className="text-xs text-muted-foreground">Finish early only when every workout for {fmtDate(focus.date, { weekday: "short" })} is logged.</p>
            </div>
            <Button disabled={!canFinish} onClick={() => { endFocus(); notify("Focus mode finished."); }}>
              {canFinish && <CheckCircle2 size={16} />}
              Finish focus mode
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
