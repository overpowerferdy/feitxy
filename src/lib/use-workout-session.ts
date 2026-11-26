import { exercisesForDate, parseSets, workoutForDate } from "@/lib/fittrack-data";
import { fmtDate, useFeit } from "@/lib/feit-store";
import { exerciseKey } from "@/components/feit/workout-exercise-card";

/** Shared workout-day data and actions for the normal page and focus overlay. */
export function useWorkoutSession(date: string) {
  const { data, update, today, notify } = useFeit();
  const moves = data.rescheduledWorkouts;
  const overrides = data.workoutOverrides;
  const plan = workoutForDate(date, moves, overrides);
  const entry = data.workouts.find((w) => w.date === date && w.name === plan.type);
  const done = entry?.completed ?? [];
  const setsLog = entry?.sets ?? {};
  const weightsLog = entry?.weights ?? {};
  const visible = exercisesForDate(date, plan, data.exerciseMoves);
  const isWorkout = plan.type.startsWith("Workout") || visible.some((x) => x.from);
  const canTrack = !!today && date <= today;

  function save(completed: string[], coreDone: boolean, sets: Record<string, number[]> = setsLog, weights: Record<string, number[]> = weightsLog) {
    update((c) => ({ ...c, workouts: [...c.workouts.filter((w) => !(w.date === date && w.name === plan.type)), { date, name: plan.type, completed, coreDone, sets, weights }] }));
  }
  function toggle(ex: string) {
    save(done.includes(ex) ? done.filter((x) => x !== ex) : [...done, ex], entry?.coreDone ?? false);
  }
  function logSets(ex: string, next: number[], nextWeights: number[], total: number | undefined) {
    const sets = { ...setsLog, [ex]: next };
    const weights = { ...weightsLog, [ex]: nextWeights };
    const complete = total !== undefined && next.length >= total;
    const completed = complete ? Array.from(new Set([...done, ex])) : done;
    save(completed, entry?.coreDone ?? false, sets, weights);
    if (complete && !done.includes(ex)) notify(`${ex.split(" · ")[0]} done!`);
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
  function moveExercise(ex: string, from: string, to: string) {
    update((c) => {
      const m = { ...(c.exerciseMoves ?? {}) };
      const key = `${from}|${ex}`;
      if (to === from) delete m[key]; else m[key] = to;
      return { ...c, exerciseMoves: m };
    });
    if (to !== from) notify(`${ex.split(" · ")[0]} moved to ${fmtDate(to, { weekday: "long" })}.`);
  }
  function saveCustomPlan(title: string, type: string, exercises: string[]) {
    update((c) => ({ ...c, workoutOverrides: { ...c.workoutOverrides, [date]: { day: fmtDate(date, { weekday: "long" }), title, type, exercises } }, workouts: c.workouts.filter((w) => w.date !== date) }));
    notify("Workout updated for this day.");
  }
  function deleteWorkout() {
    update((c) => {
      const nextOverrides = { ...c.workoutOverrides };
      delete nextOverrides[date];
      return { ...c, workoutOverrides: nextOverrides, workouts: c.workouts.filter((w) => w.date !== date) };
    });
    notify("Workout deleted.");
  }

  const totalSets = visible.reduce((sum, { ex }) => sum + (parseSets(ex.split(" · ")[1])?.count ?? 0), 0);
  const loggedSets = visible.reduce((sum, { ex }) => sum + Math.min(setsLog[ex]?.length ?? 0, parseSets(ex.split(" · ")[1])?.count ?? 0), 0);
  return { data, update, today, notify, moves, overrides, plan, entry, done, setsLog, weightsLog, visible, isWorkout, canTrack, save, toggle, logSets, saveVideo, moveExercise, saveCustomPlan, deleteWorkout, totalSets, loggedSets };
}
