import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, Check, ChevronLeft, ChevronRight, Clock3, Flame, Focus, Image as ImageIcon, Link2, Pencil, Play, ShieldCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CoachPanel } from "@/components/coach-panel";
import { DayPhoto } from "@/components/feit/photo-panel";
import { SetTracker } from "@/components/feit/set-tracker";
import { PageHeader } from "@/components/feit/ui";
import { addDays, canRescheduleWorkout, coreFinisher, exercisesForDate, mondayOf, parseSets, workoutForDate } from "@/lib/fittrack-data";
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
const exerciseKey = (exercise: string) => exercise.split(" · ")[0]?.trim().toLowerCase() ?? "";

/** Accepts a YouTube URL, nocookie embed URL, or a bare 11-character video ID. */
function videoIdFrom(input: string) {
  const value = input.trim();
  if (!value) return null;
  if (/^[\w-]{11}$/.test(value)) return value;
  try {
    const url = new URL(value);
    if (url.hostname.endsWith("youtu.be")) return url.pathname.slice(1).split("/")[0] ?? null;
    const fromQuery = url.searchParams.get("v");
    const fromEmbed = /\/embed\/([\w-]{11})/.exec(url.pathname)?.[1];
    const id = fromQuery ?? fromEmbed;
    return id && /^[\w-]{11}$/.test(id) ? id : null;
  } catch { return null; }
}

function ExerciseCard({ ex, checked, onToggle, canCheck, logged, weights, onLog, moveDays, onMove, movedFrom, onMoveBack, videoId, onSaveVideo }: {
  ex: string; checked: boolean; onToggle?: () => void; canCheck: boolean;
  logged?: number[] | undefined; weights?: number[] | undefined;
  onLog?: ((next: number[], nextWeights: number[]) => void) | undefined;
  moveDays?: string[]; onMove?: (to: string) => void; movedFrom?: string | undefined; onMoveBack?: (() => void) | undefined;
  videoId?: string | undefined; onSaveVideo: (id: string) => void;
}) {
  const [moving, setMoving] = useState(false);
  const g = guide(ex);
  const src = g && img(g[1]);
  const video = videoId || g?.[3] || undefined;
  const [name, sets] = ex.split(" · ");
  const [mode, setMode] = useState<"picture" | "video">("picture");
  const [videoOpen, setVideoOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [videoError, setVideoError] = useState("");
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
        {movedFrom && <p className="mt-1 text-xs font-semibold text-muted-foreground">Moved here from {fmtDate(movedFrom, { weekday: "long" })} {onMoveBack && <button type="button" className="ml-1 underline" onClick={onMoveBack}>Move back</button>}</p>}
        {g && <p className="mt-2 text-sm text-muted-foreground">{g[2]}</p>}
        {onMove && moveDays && moveDays.length > 0 && (!moving
          ? <button type="button" className="mt-2 flex items-center gap-1 text-xs font-semibold text-primary" onClick={() => setMoving(true)}><ArrowRight size={12} />Move this exercise to another day</button>
          : <div className="mt-2 rounded-lg bg-muted/60 p-2"><p className="text-xs font-semibold">Move {name} to:</p><div className="mt-1.5 flex flex-wrap gap-1.5">{moveDays.map((d) => <Button key={d} type="button" size="sm" variant="outline" className="h-8 px-2.5 text-xs" onClick={() => { onMove(d); setMoving(false); }}>{fmtDate(d, { weekday: "short" })}</Button>)}<Button type="button" size="sm" variant="ghost" className="h-8 px-2.5 text-xs" onClick={() => setMoving(false)}>Cancel</Button></div></div>)}
        {onLog && <SetTracker name={name ?? ex} sets={sets} logged={logged ?? []} weights={weights} onChange={onLog} />}
        <button type="button" onClick={() => { setDraft(video ?? ""); setVideoError(""); setVideoOpen(true); }} className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground transition-colors hover:text-primary"><Link2 size={13} />Edit video link</button>
      </div>
      <Dialog open={videoOpen} onOpenChange={setVideoOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Video for {name}</DialogTitle><DialogDescription>Paste a YouTube link or video ID. Leave it empty to restore the default guide.</DialogDescription></DialogHeader>
          <form className="grid gap-3" onSubmit={(e) => { e.preventDefault(); const parsed = draft.trim() ? videoIdFrom(draft) : null; if (draft.trim() && !parsed) { setVideoError("Use a YouTube link or an 11-character video ID."); return; } onSaveVideo(parsed ?? ""); setVideoOpen(false); }}>
            <Input value={draft} onChange={(e) => { setDraft(e.target.value); setVideoError(""); }} placeholder="https://youtube.com/watch?v=…" aria-label="YouTube link" />
            {videoError && <p className="text-sm text-destructive" role="alert">{videoError}</p>}
            <DialogFooter className="gap-2">
              <Button type="button" variant="ghost" onClick={() => setVideoOpen(false)}>Cancel</Button>
              {video && <Button type="button" variant="outline" onClick={() => { onSaveVideo(""); setVideoOpen(false); }}><Trash2 size={14} />Remove</Button>}
              <Button type="submit">Save link</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </article>
  );
}

export function WorkoutView() {
  const { data, update, today, notify } = useFeit();
  const [weekOffset, setWeekOffset] = useState(0);
  const [picked, setPicked] = useState("");
  const [focus, setFocus] = useState(false);
  const monday = addDays(mondayOf(today || "2026-11-16"), weekOffset * 7);
  const week = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  const date = picked || (weekOffset === 0 ? today : week[0]) || week[0]!;
  const moves = data.rescheduledWorkouts;
  const overrides = data.workoutOverrides;
  const plan = workoutForDate(date, moves, overrides);
  const entry = data.workouts.find((w) => w.date === date && w.name === plan.type);
  const done = entry?.completed ?? [];
  const exMoves = data.exerciseMoves ?? {};
  const dayExercises = exercisesForDate(date, plan, exMoves);
  const isWorkout = plan.type.startsWith("Workout") || dayExercises.some((x) => x.from);
  const isMissed = weekOffset === 0 && isWorkout && date < today && !moves[date] && done.length === 0;
  const canMove = isWorkout && !!today && !moves[date] && done.length === 0;
  const freeDays = week.filter((d) => canRescheduleWorkout(date, d, today) && !workoutForDate(d, moves, overrides).type.startsWith("Workout") && !Object.values(moves).includes(d));

  const setsLog = entry?.sets ?? {};
  const weightsLog = entry?.weights ?? {};
  function save(completed: string[], coreDone: boolean, sets: Record<string, number[]> = setsLog, weights: Record<string, number[]> = weightsLog) {
    update((c) => ({ ...c, workouts: [...c.workouts.filter((w) => !(w.date === date && w.name === plan.type)), { date, name: plan.type, completed, coreDone, sets, weights }] }));
  }
  /** Move one exercise to another day this week (or back where it came from). */
  function moveExercise(ex: string, from: string, to: string) {
    update((c) => { const m = { ...(c.exerciseMoves ?? {}) }; const key = `${from}|${ex}`; if (to === from) delete m[key]; else m[key] = to; return { ...c, exerciseMoves: m }; });
    if (to !== from) notify(`${ex.split(" · ")[0]} moved to ${fmtDate(to, { weekday: "long" })}.`);
  }
  const canTrack = isWorkout && !!today && date <= today;
  /** Log sets and their kg values; finishing every set ticks the exercise off automatically. */
  function logSets(ex: string, next: number[], nextWeights: number[], total: number | undefined) {
    const sets = { ...setsLog, [ex]: next };
    const weights = { ...weightsLog, [ex]: nextWeights };
    const complete = total !== undefined && next.length >= total;
    const completed = complete ? Array.from(new Set([...done, ex])) : done;
    save(completed, entry?.coreDone ?? false, sets, weights);
    if (complete && !done.includes(ex)) notify(`${ex.split(" · ")[0]} done!`);
  }
  function move(from: string, to: string) {
    const fromPlan = workoutForDate(from, moves, overrides);
    if (!canRescheduleWorkout(from, to, today) || !fromPlan.type.startsWith("Workout") || workoutForDate(to, moves, overrides).type.startsWith("Workout")) { notify("That day can't take this workout."); return false; }
    update((c) => ({ ...c, rescheduledWorkouts: { ...c.rescheduledWorkouts, [from]: to } }));
    notify(`${fromPlan.type} moved to ${fmtDate(to, { weekday: "long" })}.`);
    setPicked(to);
    return true;
  }
  function undo() { update((c) => { const r = { ...c.rescheduledWorkouts }; const k = Object.keys(r).find((k) => k === date || r[k] === date); if (k) delete r[k]; return { ...c, rescheduledWorkouts: r }; }); }
  const movedFrom = Object.keys(moves).find((k) => moves[k] === date);

  function savePlan(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const title = String(f.get("title") ?? "").trim();
    const type = String(f.get("type") ?? "Workout").trim();
    const exercises = String(f.get("exercises") ?? "").split("\n").map((line) => line.trim()).filter(Boolean);
    if (!title || !type || !exercises.length) { notify("Add a title and at least one exercise."); return; }
    update((c) => ({ ...c, workoutOverrides: { ...c.workoutOverrides, [date]: { day: fmtDate(date, { weekday: "long" }), title, type, exercises } }, workouts: c.workouts.filter((w) => w.date !== date) }));
    notify("Workout updated for this day.");
  }
  function deleteWorkout() {
    if (!window.confirm(`Delete ${plan.title} on ${fmtDate(date)}? Your edits and logged sets for this day will be removed.`)) return;
    update((c) => {
      const nextOverrides = { ...c.workoutOverrides };
      delete nextOverrides[date];
      return { ...c, workoutOverrides: nextOverrides, workouts: c.workouts.filter((w) => w.date !== date) };
    });
    notify("Workout deleted.");
  }
  function saveVideo(ex: string, id: string) {
    const key = exerciseKey(ex);
    update((c) => {
      const links = { ...c.videoLinks };
      if (id) links[key] = id; else delete links[key];
      return { ...c, videoLinks: links };
    });
    notify(id ? "Video link updated." : "Default video restored.");
  }

  const visible = isWorkout ? dayExercises : plan.exercises.map((ex) => ({ ex, from: undefined as string | undefined }));
  const totalSets = visible.reduce((sum, { ex }) => sum + (parseSets(ex.split(" · ")[1])?.count ?? 0), 0);
  const loggedSets = visible.reduce((sum, { ex }) => sum + Math.min(setsLog[ex]?.length ?? 0, parseSets(ex.split(" · ")[1])?.count ?? 0), 0);
  const focusComplete = totalSets > 0 ? loggedSets >= totalSets : done.length >= visible.length;

  // While focus mode is open, keep the user inside the session until it is finished.
  useEffect(() => {
    if (!focus) return;
    const blockEscape = (e: KeyboardEvent) => { if (e.key === "Escape") e.preventDefault(); };
    const blockBack = () => window.history.pushState(null, "", window.location.href);
    window.addEventListener("keydown", blockEscape, true);
    window.addEventListener("popstate", blockBack);
    window.history.pushState(null, "", window.location.href);
    return () => { window.removeEventListener("keydown", blockEscape, true); window.removeEventListener("popstate", blockBack); };
  }, [focus]);

  function exerciseGrid() {
    return (
      <div className="feit-stagger mt-5 grid gap-4 sm:grid-cols-2">
        {visible.map(({ ex, from }) => {
          const checked = done.includes(ex);
          const origin = from ?? date;
          return <ExerciseCard key={ex} ex={ex} checked={checked} canCheck={isWorkout} onToggle={() => save(checked ? done.filter((x) => x !== ex) : [...done, ex], entry?.coreDone ?? false)} movedFrom={from} onMoveBack={from ? () => moveExercise(ex, from, from) : undefined} moveDays={isWorkout && !checked && !(setsLog[ex]?.length) ? week.filter((d) => d !== date && (!today || d >= today)) : []} onMove={(to) => moveExercise(ex, origin, to)} logged={setsLog[ex]} weights={weightsLog[ex]} videoId={data.videoLinks[exerciseKey(ex)]} onSaveVideo={(id) => saveVideo(ex, id)} onLog={canTrack ? (next, nextWeights) => logSets(ex, next, nextWeights, parseSets(ex.split(" · ")[1])?.count) : undefined} />;
        })}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Move well, build steadily" title="Workouts" subtitle="Browse any week, watch a guide, then log reps, kg and rest." action={canTrack ? <Button size="sm" variant="outline" onClick={() => setFocus(true)}><Focus size={14} />Focus mode</Button> : undefined} />

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
          <form key={date} onSubmit={savePlan} className="mt-4 grid gap-3">
            <label className="grid gap-1 text-xs font-bold text-muted-foreground">Title<Input name="title" defaultValue={plan.title} required /></label>
            <label className="grid gap-1 text-xs font-bold text-muted-foreground">Type<Input name="type" defaultValue={plan.type} required /></label>
            <label className="grid gap-1 text-xs font-bold text-muted-foreground">Exercises <span className="font-normal">(one per line, e.g. Goblet Squat · 3 × 10)</span><Textarea name="exercises" defaultValue={plan.exercises.join("\n")} rows={5} required /></label>
            <div className="flex flex-wrap gap-2"><Button type="submit" size="sm">Save workout</Button><Button type="button" size="sm" variant="destructive" onClick={deleteWorkout}><Trash2 size={14} />Delete workout</Button></div>
          </form>
        </details>

        {!focus && exerciseGrid()}

        {!focus && isWorkout && <details className="mt-5 rounded-2xl bg-muted/60 p-4"><summary className="cursor-pointer font-bold">Core finisher {entry?.coreDone ? "✓" : "(optional)"}</summary>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{coreFinisher.map((ex) => <ExerciseCard key={ex} ex={ex} checked={false} canCheck={false} logged={setsLog[ex]} weights={weightsLog[ex]} videoId={data.videoLinks[exerciseKey(ex)]} onSaveVideo={(id) => saveVideo(ex, id)} onLog={canTrack ? (next, nextWeights) => save(done, entry?.coreDone ?? false, { ...setsLog, [ex]: next }, { ...weightsLog, [ex]: nextWeights }) : undefined} />)}</div>
          <Button className="mt-4" variant={entry?.coreDone ? "secondary" : "default"} onClick={() => save(done, !entry?.coreDone)}>{entry?.coreDone ? "Completed" : "Mark core done"}</Button></details>}

        {!focus && isWorkout && date <= today && <div className="mt-5"><DayPhoto date={date} /></div>}
      </section>

      <CoachPanel area="workout" today={today} onApplyMove={move} logs={{ thisWeek: week.map((d) => ({ date: d, planned: workoutForDate(d, moves, overrides).type, done: data.workouts.find((w) => w.date === d)?.completed.length ?? 0 })), moves, strength: data.strength.slice(-6), recent: data.workouts.slice(-12) }} />

      <div className="grid gap-3 text-sm sm:grid-cols-3">
        {([[Flame, "Warm up 5–10 min"], [Clock3, "Rest 1–3 min between sets"], [ShieldCheck, "Stop if pain is sharp"]] as const).map(([Icon, t]) => <div key={t} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4"><Icon size={18} className="text-primary" />{t}</div>)}
      </div>

      {focus && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-background" role="dialog" aria-modal="true" aria-label="Focus mode">
          <div className="mx-auto max-w-3xl space-y-4 p-4 pb-28 sm:p-6">
            <header className="sticky top-0 z-10 rounded-2xl border border-border bg-card/95 p-4 backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-wide text-primary">Focus mode</p>
              <h2 className="mt-1 text-2xl font-extrabold">{plan.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground" aria-live="polite">{Math.min(loggedSets, totalSets)} / {totalSets || visible.length} sets · {done.length} / {visible.length} exercises done</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${focusComplete ? 100 : Math.round((totalSets ? loggedSets / totalSets : done.length / visible.length) * 100)}%` }} /></div>
            </header>
            {exerciseGrid()}
            <div className="fixed inset-x-0 bottom-0 border-t border-border bg-card/95 p-4 backdrop-blur">
              <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">{focusComplete ? "Session complete — great work!" : "Finish every set to leave focus mode."}</p>
                <Button disabled={!focusComplete} onClick={() => { setFocus(false); setPicked(date); notify("Focus mode finished."); }}>Finish session</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
