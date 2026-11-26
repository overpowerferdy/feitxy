import { Link } from "@tanstack/react-router";
import { ChevronRight, Code2, Dumbbell, Footprints, Moon, NotebookPen, Utensils } from "lucide-react";
import { Card, CardTitle, PageHeader, ProgressBar, Stat } from "@/components/feit/ui";
import { RoutineList, useRoutineToday } from "@/components/feit/routine-list";
import { CODING_TARGET_MINUTES, minutesLabel, workoutForDate } from "@/lib/fittrack-data";
import { fmtDate, fmtTime, useFeit } from "@/lib/feit-store";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

export function TodayView() {
  const { data, today, hydrated } = useFeit();
  const { items, done, current, next } = useRoutineToday(today);
  const plan = today ? workoutForDate(today, data.rescheduledWorkouts, data.workoutOverrides) : undefined;
  const steps = data.steps.filter((s) => s.date === today).reduce((sum, s) => sum + s.steps, 0);
  const km = data.steps.filter((s) => s.date === today).reduce((sum, s) => sum + s.km, 0);
  const sleep = data.sleep.find((s) => s.date === today);
  const protein = data.meals.filter((m) => m.date === today).reduce((sum, m) => sum + m.protein, 0);
  const coding = data.coding.filter((c) => c.date === today).reduce((sum, c) => sum + c.minutes, 0);
  const journal = data.journal[today];
  const isWorkout = plan?.type.startsWith("Workout");

  return (
    <div className="space-y-5">
      <PageHeader eyebrow={hydrated ? fmtDate(today, { weekday: "long", month: "long", day: "numeric" }) : "Today"} title={`${hydrated ? greeting() : "Hello"}, Ferdy`} subtitle="Here's your day at a glance." />

      <Card className="feit-hero overflow-hidden p-5 sm:p-6">
        <p className="text-xs font-bold uppercase tracking-wider opacity-80">Right now</p>
        <h2 className="mt-1 text-2xl font-extrabold sm:text-3xl">{current?.title ?? "Your day starts soon"}</h2>
        <p className="mt-1 text-sm opacity-85">{current ? `${fmtTime(current.time)}${current.end ? ` – ${fmtTime(current.end)}` : ""}` : items[0] ? `First up: ${items[0].title} at ${fmtTime(items[0].time)}` : ""}</p>
        {next && <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-sidebar-foreground/15 px-3 py-1.5 text-xs font-semibold">Next · {next.title} at {fmtTime(next.time)}</p>}
        <div className="mt-5"><div className="h-2 overflow-hidden rounded-full bg-sidebar-foreground/20"><div className="feit-bar h-full rounded-full bg-accent" style={{ width: `${items.length ? Math.round((done.filter((d) => items.some((i) => i.id === d)).length / items.length) * 100) : 0}%` }} /></div><p className="mt-1.5 text-xs opacity-80">{done.filter((d) => items.some((i) => i.id === d)).length} of {items.length} routine steps done</p></div>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon={Footprints} label="Steps" value={steps.toLocaleString()} detail={`${km.toFixed(2)} km · goal ${data.stepGoal.toLocaleString()}`} accent />
        <Stat icon={Moon} label="Sleep" value={sleep ? minutesLabel(sleep.minutes) : "—"} detail="Last night" />
        <Stat icon={Utensils} label="Protein" value={`${protein} g`} detail="Logged today" />
        <Stat icon={Code2} label="Coding" value={minutesLabel(coding)} detail={`Aim ${minutesLabel(CODING_TARGET_MINUTES)}`} />
      </div>

      <Card className="p-5 sm:p-6">
        <CardTitle title="Daily routine" hint="Tap the circle when done. Missed something? Move it to another time." action={<Link to="/habits" className="text-sm font-semibold text-primary">Edit</Link>} />
        {hydrated && <RoutineList date={today} isToday />}
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link to="/workouts" className="feit-lift block rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between"><span className="flex size-10 items-center justify-center rounded-xl bg-secondary text-primary"><Dumbbell size={20} /></span><ChevronRight size={18} className="text-muted-foreground" /></div>
          <p className="mt-3 text-xs font-semibold uppercase text-primary">Today's training</p>
          <p className="mt-0.5 text-lg font-bold">{plan?.title ?? "—"}</p>
          <p className="mt-1 text-sm text-muted-foreground">{isWorkout ? `${plan?.exercises.length} exercises with pictures & videos` : "Rest and recover today."}</p>
        </Link>
        <Link to="/journal" className="feit-lift block rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between"><span className="flex size-10 items-center justify-center rounded-xl bg-secondary text-primary"><NotebookPen size={20} /></span><ChevronRight size={18} className="text-muted-foreground" /></div>
          <p className="mt-3 text-xs font-semibold uppercase text-primary">Journal</p>
          <p className="mt-0.5 text-lg font-bold">{journal ? "Today's entry saved" : "How was your day?"}</p>
          <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{journal?.text || "Write a few lines before bed."}</p>
        </Link>
      </div>

      <Card className="p-5 sm:p-6">
        <CardTitle title="This week" />
        <div className="grid gap-4 sm:grid-cols-2">
          <ProgressBar label="Workouts" value={data.workouts.filter((w) => w.date >= weekStart(today) && w.date <= today && w.completed.length > 0 && w.name.startsWith("Workout")).length} max={3} right={`${data.workouts.filter((w) => w.date >= weekStart(today) && w.date <= today && w.completed.length > 0 && w.name.startsWith("Workout")).length} / 3`} />
          <ProgressBar label="Atomic Habits" value={data.readingPage} max={data.bookPages} right={`${data.readingPage} / ${data.bookPages} pages`} />
        </div>
      </Card>
    </div>
  );
}

function weekStart(date: string) {
  if (!date) return "";
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
