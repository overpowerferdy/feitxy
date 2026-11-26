import { useState, type FormEvent } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Clock3, Flame, Focus, Pencil, ShieldCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CoachPanel } from "@/components/coach-panel";
import { DayPhoto } from "@/components/feit/photo-panel";
import { ExerciseCard, exerciseKey } from "@/components/feit/workout-exercise-card";
import { PageHeader } from "@/components/feit/ui";
import { addDays, canRescheduleWorkout, coreFinisher, mondayOf, parseSets, workoutForDate } from "@/lib/fittrack-data";
import { fmtDate, useFeit } from "@/lib/feit-store";
import { useWorkoutSession } from "@/lib/use-workout-session";

const FOCUS_PRESETS = [5, 15, 25, 45];

export function WorkoutView() {
  const { focus, startFocus, today: rawToday } = useFeit();
  const [weekOffset, setWeekOffset] = useState(0);
  const [picked, setPicked] = useState("");
  const [focusOpen, setFocusOpen] = useState(false);
  const [focusMinutes, setFocusMinutes] = useState("25");
  const [focusError, setFocusError] = useState("");
  const monday = addDays(mondayOf(rawToday || "2026-11-16"), weekOffset * 7);
  const week = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  const date = picked || (focus?.date && weekOffset === 0 ? focus.date : undefined) || (weekOffset === 0 ? rawToday : week[0]) || week[0]!;
  const session = useWorkoutSession(date);
  const { data, update, today, notify, moves, overrides, plan, done, visible, isWorkout, canTrack } = session;

  const isMissed = weekOffset === 0 && isWorkout && date < today && !moves[date] && done.length === 0;
  const canMove = isWorkout && !!today && !moves[date] && done.length === 0;
  const freeDays = week.filter((d) => canRescheduleWorkout(date, d, today) && !workoutForDate(d, moves, overrides).type.startsWith("Workout") && !Object.values(moves).includes(d));
  const movedFrom = Object.keys(moves).find((k) => moves[k] === date);

  function move(from: string, to: string) {
    const fromPlan = workoutForDate(from, moves, overrides);
    if (!canRescheduleWorkout(from, to, today) || !fromPlan.type.startsWith("Workout") || workoutForDate(to, moves, overrides).type.startsWith("Workout")) { notify("That day can't take this workout."); return false; }
    update((c) => ({ ...c, rescheduledWorkouts: { ...c.rescheduledWorkouts, [from]: to } }));
    notify(`${fromPlan.type} moved to ${fmtDate(to, { weekday: "long" })}.`);
    setPicked(to);
    return true;
  }
  function undo() { update((c) => { const r = { ...c.rescheduledWorkouts }; const k = Object.keys(r).find((k) => k === date || r[k] === date); if (k) delete r[k]; return { ...c, rescheduledWorkouts: r }; }); }
  function startFocusSession(minutes: number) {
    startFocus(date, minutes * 60);
    setFocusOpen(false);
    notify(`Focus started: ${minutes} minutes, or until all logs are done.`);
  }
  function submitFocus(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const minutes = Math.round(Number(focusMinutes));
    if (!Number.isFinite(minutes) || minutes < 1 || minutes > 180) { setFocusError("Choose 1–180 minutes."); return; }
    startFocusSession(minutes);
  }
  function submitPlan(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const title = String(f.get("title") ?? "").trim();
    const type = String(f.get("type") ?? "Workout").trim();
    const exercises = String(f.get("exercises") ?? "").split("\n").map((line) => line.trim()).filter(Boolean);
    if (!title || !type || !exercises.length) { notify("Add a title and at least one exercise."); return; }
    session.saveCustomPlan(title, type, exercises);
  }
  function deletePlan() {
    if (window.confirm(`Delete ${plan.title} on ${fmtDate(date)}? Your edits and logged sets for this day will be removed.`)) session.deleteWorkout();
  }

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Move well, build steadily" title="Workouts" subtitle="Browse any week, watch a guide, then log reps, kg and rest." action={canTrack ? <Button size="sm" variant="outline" disabled={!!focus} onClick={() => { setFocusMinutes("25"); setFocusError(""); setFocusOpen(true); }}><Focus size={14} />{focus ? "Focus running" : "Focus mode"}</Button> : undefined} />

      <div className="flex items-center justify-between gap-2 rounded-2xl border border-border bg-card px-2 py-2">
        <Button type="button" size="icon" variant="ghost" aria-label="Previous week" onClick={() => { setWeekOffset((w) => w - 1); setPicked(""); }}><ChevronLeft size={18} /></Button>
        <p className="text-sm font-extrabold tabular-nums">{fmtDate(week[0]!, { month: "short", day: "numeric" })} – {fmtDate(week[6]!, { month: "short", day: "numeric" })}{weekOffset === 0 ? " · This week" : ""}</p>
        <Button type="button" size="icon" variant="ghost" aria-label="Next week" onClick={() => { setWeekOffset((w) => w + 1); setPicked(""); }}><ChevronRight size={18} /></Button>
      </div>

      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {week.map((d) => { const active = d === date; const isToday = d === today;
          return <button key={d} onClick={() => setPicked(d)} aria-label={`Select ${fmtDate(d, { weekday: "long", month: "long", day: "numeric" })}`} aria-pressed={active} className={`relative min-w-0 rounded-xl border px-0.5 py-2.5 text-center transition-all duration-200 active:scale-95 ${active ? "-translate-y-0.5 border-primary bg-primary text-primary-foreground shadow-md" : "border-border bg-card hover:bg-muted"}`}>
            <span className={`text-sm font-bold ${active ? "" : "text-muted-foreground"}`}>{fmtDate(d, { weekday: "short" })}</span>
            <span className={`block text-[0.65rem] tabular-nums ${active ? "" : "text-muted-foreground"}`}>{Number(d.slice(8))}</span>
            {isToday && <span className={`absolute bottom-1 left-1/2 size-1.5 -translate-x-1/2 rounded-full ${active ? "bg-accent" : "bg-primary"}`} />}
          </button>; })}
      </div>

      <section className="feit-card rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><p className="text-xs font-bold uppercase text-primary">{fmtDate(date, { weekday: "long", month: "short", day: "numeric" })}</p><h2 className="mt-1 text-2xl font-extrabold">{plan.title}</h2>{movedFrom && <p className="mt-1 text-sm text-muted-foreground">Moved here from {fmtDate(movedFrom, { weekday: "long" })}</p>}</div>
          {isWorkout && <span className="rounded-full bg-secondary px-3 py-1 text-sm font-bold text-secondary-foreground">{visible.filter((x) => done.includes(x.ex)).length} / {visible.length} done</span>}
        </div>
        {canMove && <div className="mt-4 rounded-xl bg-accent/50 p-4"><p className="font-semibold">{isMissed ? "Missed this one? Move it to a free day this week." : "Can't train this day? Move it to another free day this week."}</p>
          {freeDays.length ? <div className="mt-3 flex flex-wrap gap-2">{freeDays.map((d) => <Button key={d} size="sm" variant="outline" onClick={() => window.confirm(`Move ${plan.type} to ${fmtDate(d, { weekday: "long" })}?`) && move(date, d)}><ArrowRight />{fmtDate(d, { weekday: "long" })}</Button>)}</div> : <p className="mt-1 text-sm text-muted-foreground">No free days left this week — that's okay, start fresh next week.</p>}</div>}
        {(movedFrom || moves[date]) && <Button size="sm" variant="ghost" className="mt-3" onClick={undo}>Undo move</Button>}

        <details className="mt-4 rounded-xl bg-muted/60 p-4">
          <summary className="flex cursor-pointer items-center gap-2 font-bold"><Pencil size={15} />Edit this workout</summary>
          <form key={date} onSubmit={submitPlan} className="mt-4 grid gap-3">
            <label className="grid gap-1 text-xs font-bold text-muted-foreground">Title<Input name="title" defaultValue={plan.title} required /></label>
            <label className="grid gap-1 text-xs font-bold text-muted-foreground">Type<Input name="type" defaultValue={plan.type} required /></label>
            <label className="grid gap-1 text-xs font-bold text-muted-foreground">Exercises <span className="font-normal">(one per line, e.g. Goblet Squat · 3 × 10)</span><Textarea name="exercises" defaultValue={plan.exercises.join("\n")} rows={5} required /></label>
            <div className="flex flex-wrap gap-2"><Button type="submit" size="sm">Save workout</Button><Button type="button" size="sm" variant="destructive" onClick={deletePlan}><Trash2 size={14} />Delete workout</Button></div>
          </form>
        </details>

        <div className="feit-stagger mt-5 grid gap-4 sm:grid-cols-2">
          {visible.map(({ ex, from }) => {
            const checked = done.includes(ex);
            const origin = from ?? date;
            return <ExerciseCard key={ex} ex={ex} checked={checked} canCheck={isWorkout} onToggle={() => session.toggle(ex)} movedFrom={from} onMoveBack={from ? () => session.moveExercise(ex, from, from) : undefined} moveDays={isWorkout && !checked && !(session.setsLog[ex]?.length) ? week.filter((d) => d !== date && (!today || d >= today)) : []} onMove={(to) => session.moveExercise(ex, origin, to)} logged={session.setsLog[ex]} weights={session.weightsLog[ex]} videoId={data.videoLinks[exerciseKey(ex)]} onSaveVideo={(id) => session.saveVideo(ex, id)} onLog={canTrack ? (next, nextWeights) => session.logSets(ex, next, nextWeights, parseSets(ex.split(" · ")[1])?.count) : undefined} />;
          })}
        </div>

        {isWorkout && <details className="mt-5 rounded-2xl bg-muted/60 p-4"><summary className="cursor-pointer font-bold">Core finisher {session.entry?.coreDone ? "✓" : "(optional)"}</summary>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{coreFinisher.map((ex) => <ExerciseCard key={ex} ex={ex} checked={false} canCheck={false} logged={session.setsLog[ex]} weights={session.weightsLog[ex]} videoId={data.videoLinks[exerciseKey(ex)]} onSaveVideo={(id) => session.saveVideo(ex, id)} onLog={canTrack ? (next, nextWeights) => session.save(done, session.entry?.coreDone ?? false, { ...session.setsLog, [ex]: next }, { ...session.weightsLog, [ex]: nextWeights }) : undefined} />)}</div>
          <Button className="mt-4" variant={session.entry?.coreDone ? "secondary" : "default"} onClick={() => session.save(done, !session.entry?.coreDone)}>{session.entry?.coreDone ? "Completed" : "Mark core done"}</Button></details>}

        {isWorkout && date <= today && <div className="mt-5"><DayPhoto date={date} /></div>}
      </section>

      <CoachPanel area="workout" today={today} onApplyMove={move} logs={{ thisWeek: week.map((d) => ({ date: d, planned: workoutForDate(d, moves, overrides).type, done: data.workouts.find((w) => w.date === d)?.completed.length ?? 0 })), moves, strength: data.strength.slice(-6), recent: data.workouts.slice(-12) }} />

      <div className="grid gap-3 text-sm sm:grid-cols-3">
        {([[Flame, "Warm up 5–10 min"], [Clock3, "Rest 1–3 min between sets"], [ShieldCheck, "Stop if pain is sharp"]] as const).map(([Icon, t]) => <div key={t} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4"><Icon size={18} className="text-primary" />{t}</div>)}
      </div>

      <Dialog open={focusOpen} onOpenChange={setFocusOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Start focus mode</DialogTitle><DialogDescription>Choose a time. Other tabs, Back and Escape stay locked until the timer ends or every workout for {fmtDate(date, { weekday: "long" })} is logged.</DialogDescription></DialogHeader>
          <form className="grid gap-3" onSubmit={submitFocus}>
            <div className="grid grid-cols-4 gap-2">{FOCUS_PRESETS.map((m) => <Button key={m} type="button" size="sm" variant={focusMinutes === String(m) ? "default" : "outline"} onClick={() => { setFocusMinutes(String(m)); setFocusError(""); }}>{m} min</Button>)}</div>
            <label className="grid gap-1 text-xs font-bold text-muted-foreground">Custom minutes (1–180)<Input type="number" min="1" max="180" inputMode="numeric" value={focusMinutes} onChange={(e) => { setFocusMinutes(e.target.value); setFocusError(""); }} /></label>
            {focusError && <p className="text-sm text-destructive" role="alert">{focusError}</p>}
            <DialogFooter className="gap-2"><Button type="button" variant="ghost" onClick={() => setFocusOpen(false)}>Cancel</Button><Button type="submit"><Focus size={14} />Start focus</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
