import { useState } from "react";
import { ArrowRight, Check, Clock3, Flame, Image as ImageIcon, Play, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CoachPanel } from "@/components/coach-panel";
import { DayPhoto } from "@/components/feit/photo-panel";
import { SetTracker } from "@/components/feit/set-tracker";
import { PageHeader } from "@/components/feit/ui";
import { canRescheduleWorkout, coreFinisher, mondayOf, parseSets, workoutForDate } from "@/lib/fittrack-data";
import { fmtDate, useFeit } from "@/lib/feit-store";

const images = import.meta.glob("@/assets/exercises/*.jpg", { eager: true, import: "default" }) as Record<string, string>;
const img = (name: string) => Object.entries(images).find(([k]) => k.endsWith(`/${name}.jpg`))?.[1];

// [match text, picture, form cue, YouTube video id]
const map: [string, string, string, string | null][] = [
  ["Dumbbell Reverse Curls", "hammer-curl", "Palms facing down, elbows still, lower slowly.", null],
  ["Goblet Squat", "goblet-squat", "Chest up, sit between your heels, knees track over toes.", "7-80HiXX1K8"],
  ["Dumbbell Floor Press", "floor-press", "Elbows ~45°, pause lightly when upper arms touch the floor.", "T0Y3OBF1bNI"],
  ["One-Arm", "one-arm-row", "Flat back, pull the elbow toward your hip.", "dFzUjzfih7k"],
  ["Romanian", "romanian-deadlift", "Push hips back, soft knees, weights close to legs.", "hQgFixeXdZo"],
  ["Bicep Curl", "bicep-curl", "Elbows still at your sides, lower slowly.", "6DeLZ6cbgWQ"],
  ["Push-ups", "push-up", "Body in one line, chest close to the floor.", "IODxDxX7oi4"],
  ["Pull-ups", "assisted-pull-up", "Start from a dead hang, pull chest to bar. Use a band if needed.", "6zyx46Vpato"],
  ["Shoulder Press", "shoulder-press", "Ribs down, press straight overhead.", "poD_-zaG9hk"],
  ["Reverse Lunges", "reverse-lunge", "Step back, both knees about 90°.", "J9MpoAQCjos"],
  ["Hammer Curls", "hammer-curl", "Palms face each other, no swinging.", "BRVDS6HVR9Q"],
  ["Split Squats", "split-squat", "Stay tall, drop the back knee straight down.", "xIvbfd0prqg"],
  ["Chin-ups", "chin-up", "Palms toward you, chin over the bar, lower with control.", "Oi3bW9nQmGI"],
  ["Lateral Raises", "lateral-raise", "Lift to shoulder height, slight bend in elbows.", "Y29xKcze8Ik"],
  ["Plank", "plank", "Elbows under shoulders, squeeze glutes, breathe.", "xe2MXatLTUw"],
  ["Reverse Crunches", "reverse-crunch", "Curl hips off the floor, don't swing legs.", "JkTk8irSNKE"],
  ["Knee Tucks", "knee-tuck", "Lean back on your hands, pull knees to chest, extend slowly.", "x2umFUuBLRw"],
  ["Concentration Curls", "bicep-curl", "Elbow braced on inner thigh, curl slowly, squeeze at the top.", "os52QEIXQtM"],
  ["Bent-over Rows", "one-arm-row", "Hinge forward, flat back, pull both dumbbells to your hips.", null],
  ["Dumbbell Squats", "goblet-squat", "Dumbbells at your sides, sit back and down, chest up.", null],
  ["Glute Bridges", "reverse-crunch", "Dumbbell on hips, drive through heels, squeeze glutes at the top.", null],
  ["Side Bends", "plank", "Stand tall, bend sideways slowly, don't twist.", null],
  ["Reverse Curls", "hammer-curl", "Palms facing down, elbows still, lower slowly.", null],
  ["Wrist Curls", "bicep-curl", "Forearms on thighs, move only the wrists.", null],
  ["Walk", "recovery-stretch", "Easy pace — you should be able to talk.", null],
  ["Recovery day", "rest-day", "No training today. Sleep well, drink water and let your muscles rebuild.", null],
  ["Existing commitment", "commitment-day", "Busy day — that's fine. A short walk still counts if you have time.", null],
  ["Review workout progress", "weekly-review", "Look back at this week's logs and note what felt easier.", null],
  ["Check strength improvements", "push-up-b", "Compare your push-ups, pull-ups and chin-ups with last week.", null],
  ["Prepare for the next week", "plan-next-week", "Set out your dumbbells and plan which days you'll train.", null],
  ["This session is on its new day", "rest-day", "Your workout moved — rest here and train on the new day.", null],
  ["stretching", "recovery-pose", "Gentle, no bouncing.", null],
];
const guide = (exercise: string) => map.find(([k]) => exercise.includes(k));

function ExerciseCard({ ex, checked, onToggle, canCheck, logged, onLog }: { ex: string; checked: boolean; onToggle?: () => void; canCheck: boolean; logged?: number[] | undefined; onLog?: ((next: number[]) => void) | undefined }) {
  const g = guide(ex);
  const src = g && img(g[1]);
  const video = g?.[3];
  const [name, sets] = ex.split(" · ");
  const [mode, setMode] = useState<"picture" | "video">("picture");
  return (
    <article className={`feit-lift overflow-hidden rounded-2xl border bg-card ${checked ? "border-primary/50 bg-secondary/40" : "border-border"}`}>
      <div className="relative aspect-[4/3] bg-muted">
        {mode === "video" && video
          ? <iframe className="absolute inset-0 size-full" src={`https://www.youtube-nocookie.com/embed/${video}?autoplay=1&rel=0&playsinline=1&modestbranding=1`} title={`${name} tutorial video`} allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
          : src && <img src={src} alt={`How to do ${name}`} loading="lazy" width={496} height={496} className="size-full object-cover" />}
        {video && (
          <div className="absolute left-2 top-2 flex rounded-full bg-background/90 p-0.5 text-xs font-semibold shadow-sm">
            <button type="button" onClick={() => setMode("picture")} aria-pressed={mode === "picture"} className={`flex items-center gap-1 rounded-full px-2.5 py-1 ${mode === "picture" ? "bg-primary text-primary-foreground" : ""}`}><ImageIcon size={12} />Picture</button>
            <button type="button" onClick={() => setMode("video")} aria-pressed={mode === "video"} className={`flex items-center gap-1 rounded-full px-2.5 py-1 ${mode === "video" ? "bg-primary text-primary-foreground" : ""}`}><Play size={12} />Video</button>
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div><h3 className="font-bold">{name}</h3>{sets && <p className="text-sm font-semibold text-primary">{sets}</p>}</div>
          {canCheck && <button aria-label={`Mark ${name} done`} onClick={onToggle} className={`flex size-10 shrink-0 items-center justify-center rounded-full border-2 transition-colors active:scale-90 ${checked ? "feit-pop border-primary bg-primary text-primary-foreground" : "border-input text-muted-foreground hover:border-primary"}`}><Check size={18} strokeWidth={3} /></button>}
        </div>
        {g && <p className="mt-2 text-sm text-muted-foreground">{g[2]}</p>}
        {onLog && <SetTracker name={name ?? ex} sets={sets} logged={logged ?? []} onChange={onLog} />}
      </div>
    </article>
  );
}

export function WorkoutView() {
  const { data, update, today, notify } = useFeit();
  const monday = today ? mondayOf(today) : "2026-11-16";
  const week = Array.from({ length: 7 }, (_, i) => { const d = new Date(`${monday}T12:00:00`); d.setDate(d.getDate() + i); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; });
  const [picked, setPicked] = useState<string>("");
  const date = picked || today || week[0]!;
  const moves = data.rescheduledWorkouts;
  const plan = workoutForDate(date, moves);
  const entry = data.workouts.find((w) => w.date === date && w.name === plan.type);
  const done = entry?.completed ?? [];
  const isWorkout = plan.type.startsWith("Workout");
  const isMissed = isWorkout && date < today && !moves[date] && done.length === 0;
  const canMove = isWorkout && !!today && !moves[date] && done.length === 0;
  const freeDays = week.filter((d) => canRescheduleWorkout(date, d, today) && !workoutForDate(d, moves).type.startsWith("Workout") && !Object.values(moves).includes(d));

  const setsLog = entry?.sets ?? {};
  function save(completed: string[], coreDone: boolean, sets: Record<string, number[]> = setsLog) {
    update((c) => ({ ...c, workouts: [...c.workouts.filter((w) => !(w.date === date && w.name === plan.type)), { date, name: plan.type, completed, coreDone, sets }] }));
  }
  const canTrack = isWorkout && !!today && date <= today;
  /** Log sets; finishing every set ticks the exercise off automatically. */
  function logSets(ex: string, next: number[], total: number | undefined) {
    const sets = { ...setsLog, [ex]: next };
    const complete = total !== undefined && next.length >= total;
    const completed = complete ? Array.from(new Set([...done, ex])) : done;
    save(completed, entry?.coreDone ?? false, sets);
    if (complete && !done.includes(ex)) notify(`${ex.split(" · ")[0]} done!`);
  }
  function move(from: string, to: string) {
    const fromPlan = workoutForDate(from, moves);
    if (!canRescheduleWorkout(from, to, today) || !fromPlan.type.startsWith("Workout") || workoutForDate(to, moves).type.startsWith("Workout")) { notify("That day can't take this workout."); return false; }
    update((c) => ({ ...c, rescheduledWorkouts: { ...c.rescheduledWorkouts, [from]: to } }));
    notify(`${fromPlan.type} moved to ${fmtDate(to, { weekday: "long" })}.`);
    setPicked(to);
    return true;
  }
  function undo() { update((c) => { const r = { ...c.rescheduledWorkouts }; const k = Object.keys(r).find((k) => k === date || r[k] === date); if (k) delete r[k]; return { ...c, rescheduledWorkouts: r }; }); }
  const movedFrom = Object.keys(moves).find((k) => moves[k] === date);

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Move well, build steadily" title="Workouts" subtitle="Pick a day. Watch the video, then count reps and time each set." />
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {week.map((d) => { const active = d === date; const isToday = d === today;
          return <button key={d} onClick={() => setPicked(d)} aria-label={`Select ${fmtDate(d, { weekday: "long", month: "long", day: "numeric" })}`} aria-pressed={active} className={`relative min-w-0 rounded-xl border px-0.5 py-2.5 text-center transition-all duration-200 active:scale-95 ${active ? "-translate-y-0.5 border-primary bg-primary text-primary-foreground shadow-md" : "border-border bg-card hover:bg-muted"}`}>
            <span className={`text-sm font-bold ${active ? "" : "text-muted-foreground"}`}>{fmtDate(d, { weekday: "short" })}</span>
            {isToday && <span className={`absolute bottom-1 left-1/2 size-1.5 -translate-x-1/2 rounded-full ${active ? "bg-accent" : "bg-primary"}`} />}
          </button>; })}
      </div>

      <section className="feit-card rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><p className="text-xs font-bold uppercase text-primary">{fmtDate(date, { weekday: "long", month: "short", day: "numeric" })}</p><h2 className="mt-1 text-2xl font-extrabold">{plan.title}</h2>{movedFrom && <p className="mt-1 text-sm text-muted-foreground">Moved here from {fmtDate(movedFrom, { weekday: "long" })}</p>}</div>
          {isWorkout && <span className="rounded-full bg-secondary px-3 py-1 text-sm font-bold text-secondary-foreground">{done.length} / {plan.exercises.length} done</span>}
        </div>
        {canMove && <div className="mt-4 rounded-xl bg-accent/50 p-4"><p className="font-semibold">{isMissed ? "Missed this one? Move it to a free day this week." : "Can't train this day? Move it to another free day this week."}</p>
          {freeDays.length ? <div className="mt-3 flex flex-wrap gap-2">{freeDays.map((d) => <Button key={d} size="sm" variant="outline" onClick={() => window.confirm(`Move ${plan.type} to ${fmtDate(d, { weekday: "long" })}?`) && move(date, d)}><ArrowRight />{fmtDate(d, { weekday: "long" })}</Button>)}</div> : <p className="mt-1 text-sm text-muted-foreground">No free days left this week — that's okay, start fresh next week.</p>}</div>}
        {(movedFrom || moves[date]) && <Button size="sm" variant="ghost" className="mt-3" onClick={undo}>Undo move</Button>}

        <div key={date} className="feit-stagger mt-5 grid gap-4 sm:grid-cols-2">
          {plan.exercises.map((ex) => { const checked = done.includes(ex);
            return <ExerciseCard key={ex} ex={ex} checked={checked} canCheck={isWorkout} onToggle={() => save(checked ? done.filter((x) => x !== ex) : [...done, ex], entry?.coreDone ?? false)} logged={setsLog[ex]} onLog={canTrack ? (next) => logSets(ex, next, parseSets(ex.split(" · ")[1])?.count) : undefined} />; })}
        </div>

        {isWorkout && <details className="mt-5 rounded-2xl bg-muted/60 p-4"><summary className="cursor-pointer font-bold">Core finisher {entry?.coreDone ? "✓" : "(optional)"}</summary>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{coreFinisher.map((ex) => <ExerciseCard key={ex} ex={ex} checked={false} canCheck={false} logged={setsLog[ex]} onLog={canTrack ? (next) => save(done, entry?.coreDone ?? false, { ...setsLog, [ex]: next }) : undefined} />)}</div>
          <Button className="mt-4" variant={entry?.coreDone ? "secondary" : "default"} onClick={() => save(done, !entry?.coreDone)}>{entry?.coreDone ? "Completed" : "Mark core done"}</Button></details>}

        {isWorkout && date <= today && <div className="mt-5"><DayPhoto date={date} /></div>}
      </section>

      <CoachPanel area="workout" today={today} onApplyMove={move} logs={{ thisWeek: week.map((d) => ({ date: d, planned: workoutForDate(d, moves).type, done: data.workouts.find((w) => w.date === d)?.completed.length ?? 0 })), moves, strength: data.strength.slice(-6), recent: data.workouts.slice(-12) }} />

      <div className="grid gap-3 text-sm sm:grid-cols-3">
        {([[Flame, "Warm up 5–10 min"], [Clock3, "Rest 1–3 min between sets"], [ShieldCheck, "Stop if pain is sharp"]] as const).map(([Icon, t]) => <div key={t} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4"><Icon size={18} className="text-primary" />{t}</div>)}
      </div>
    </div>
  );
}
