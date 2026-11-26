export type StrengthEntry = { date: string; pushups: number; pullups: number; chinups: number };
export type SleepEntry = { date: string; bedDate?: string; bedtime: string; wakeTime: string; minutes: number };
export type WeightEntry = { date: string; kg: number };
export type MealEntry = { id: string; date: string; type: string; food: string; portion: string; protein: number };
export type PurchaseEntry = { id: string; date: string; item: string; amount: number };
export type CodingEntry = { id: string; date: string; minutes: number; note: string };
export type ReadingEntry = { id: string; date: string; pages: number; minutes: number; note: string };
export type WorkoutEntry = { date: string; name: string; completed: string[]; coreDone: boolean; sets?: Record<string, number[]>; weights?: Record<string, number[]> };
export type StepEntry = { id: string; date: string; steps: number; km: number };
export type RunEntry = { id: string; date: string; km: number; seconds: number; steps: number; source: "gps" | "manual" };
export type WorkoutOverride = { day: string; title: string; type: string; exercises: string[] };
export type JournalEntry = { date: string; mood: Mood; text: string; updatedAt: string };
export type Mood = "great" | "good" | "okay" | "low" | "rough";
export type RoutineItem = { id: string; title: string; start: string; end?: string | undefined };
export type RoutineChange = { action: "skip" } | { action: "move"; toDate: string; toTime: string };
export type LessonQuiz = { question: string; options: string[]; answer: number; explain: string };
export type Lesson = { summary: string; sections: { heading: string; body: string }[]; example: string; quiz: LessonQuiz[]; problem: { title: string; prompt: string; starter: string } };
export type CodeReview = { score: number; passed: boolean; summary: string; strengths: string[]; fixes: string[] };
export type TopicProgress = { quizScore?: number; problemCode?: string; problemReview?: CodeReview };
export type ProjectProgress = { title: string; brief: string; requirements: string[]; code?: string; review?: CodeReview };
export interface LearnProgress {
  lessons: Record<string, Lesson>;
  topics: Record<string, TopicProgress>;
  projects: Record<string, ProjectProgress>;
}

export interface FitTrackData {
  version: 1;
  habits: Record<string, string[]>;
  workouts: WorkoutEntry[];
  strength: StrengthEntry[];
  sleep: SleepEntry[];
  weight: WeightEntry[];
  meals: MealEntry[];
  purchases: PurchaseEntry[];
  coding: CodingEntry[];
  reading: ReadingEntry[];
  readingPage: number;
  bookPages: number;
  readingNotes: string;
  roadmap: Record<string, string[]>;
  rescheduledWorkouts?: Record<string, string>;
  workoutOverrides?: Record<string, WorkoutOverride>;
  videoLinks?: Record<string, string>;
  /** Single exercise moves: `${fromDate}|${exercise}` -> new date. */
  exerciseMoves?: Record<string, string>;
  steps?: StepEntry[];
  runs?: RunEntry[];
  runGoalKm?: number;
  journal?: Record<string, JournalEntry>;
  routine?: RoutineItem[];
  routineDone?: Record<string, string[]>;
  routineChanges?: Record<string, Record<string, RoutineChange>>;
  learn?: LearnProgress;
  stepGoal?: number;
  remindersOn?: boolean;
  /** Pin the phone to Feit while a focus session is running (Android). */
  focusLockOn?: boolean;
  readingGoal?: number;
}

export const STORAGE_KEY = "fittrack-data-v1";
export const WEEKLY_FOOD_LIMIT = 100;
export const SLEEP_TARGET_MINUTES = 480;
export const CODING_TARGET_MINUTES = 240;
export const DEFAULT_READING_PAGES = 15;

export const workoutSchedule = [
  { day: "Monday", title: "Rest day", type: "Rest", exercises: ["Recovery day", "Existing commitment · 10 AM–1 PM"] },
  { day: "Tuesday", title: "Workout A · Upper body", type: "Workout A", exercises: ["Pull-ups · 4 × 1–2", "Push-ups · 3 × 10–12", "One-Arm Dumbbell Rows · 3 × 10–12 each arm", "Dumbbell Shoulder Press · 3 × 10–12", "Dumbbell Lateral Raises · 3 × 12–15", "Concentration Curls · 2 × 10–12 each arm", "Dumbbell Reverse Curls · 2 × 12–15"] },
  { day: "Wednesday", title: "Rest day", type: "Recovery", exercises: ["Recovery day", "Light stretching if needed"] },
  { day: "Thursday", title: "Workout B · Lower body + abs", type: "Workout B", exercises: ["Goblet Squats · 3 × 12–15", "Dumbbell Romanian Deadlifts · 3 × 10–12", "Reverse Lunges · 3 × 10 each leg", "Dumbbell Glute Bridges · 3 × 12–15", "Reverse Crunches · 3 × 12–15", "Knee Tucks · 3 × 12–15", "Plank · 3 × 30–45 sec", "Dumbbell Side Bends · 2 × 12 each side"] },
  { day: "Friday", title: "Rest day", type: "Rest", exercises: ["Recovery day", "Existing commitment · 5–10 PM"] },
  { day: "Saturday", title: "Workout C · Full body", type: "Workout C", exercises: ["Chin-ups · 4 × 2–3", "Push-ups · 3 × 10–12", "Dumbbell Squats · 3 × 12", "Dumbbell Bent-over Rows · 3 × 10–12", "Dumbbell Shoulder Press · 2 × 10–12", "Dumbbell Hammer Curls · 3 × 10–12", "Dumbbell Wrist Curls · 2 × 12–15", "Reverse Crunches · 2 × 12–15", "Plank · 2 × 30–45 sec"] },
  { day: "Sunday", title: "Rest + progress check", type: "Review", exercises: ["Review workout progress", "Check strength improvements", "Prepare for the next week"] },
];

export const coreFinisher = ["Plank · 2–3 × 30–45 seconds", "Reverse Crunches · 2 × 12–15", "Knee Tucks · 2 × 10–12"];

export const roadmapDays = [
  { date: "2026-11-16", title: "JavaScript Fundamentals", topics: ["Variables", "Data types", "Operators", "Conditions", "Loops", "Functions", "Arrays", "Objects"] },
  { date: "2026-11-17", title: "Modern JavaScript", topics: ["Array methods", "DOM", "Events", "Arrow functions", "Destructuring", "Spread and rest", "Promises", "Async/await", "Fetch API"] },
  { date: "2026-11-18", title: "Vue Basics", topics: ["Setup", "Components", "Template syntax", "Reactivity", "ref and reactive", "v-if and v-for", "v-model", "Events"] },
  { date: "2026-11-19", title: "React Basics", topics: ["Components", "JSX", "Props", "useState", "Events", "Conditional rendering", "Lists"] },
  { date: "2026-11-20", title: "PHP Fundamentals", topics: ["Syntax", "Variables", "Conditions", "Loops", "Functions", "Arrays", "GET and POST", "Forms"] },
  { date: "2026-11-21", title: "PHP and MySQL", topics: ["PDO", "CRUD", "Prepared statements", "Validation", "Basic security"] },
  { date: "2026-11-22", title: "Review and Mini Project", topics: ["Review the week's topics", "Compare Vue and React", "Identify weak topics", "Build a small practice project"] },
];

export function createEmptyData(): FitTrackData {
  return { version: 1, habits: {}, workouts: [], strength: [], sleep: [], weight: [], meals: [], purchases: [], coding: [], reading: [], readingPage: 0, bookPages: 320, readingNotes: "", roadmap: {} };
}

export function isFitTrackData(value: unknown): value is FitTrackData {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  const arrays = ["workouts", "strength", "sleep", "weight", "meals", "purchases", "coding", "reading"];
  const objects = ["habits", "roadmap"];
  return record["version"] === 1 && arrays.every((key) => Array.isArray(record[key])) && objects.every((key) => record[key] !== null && typeof record[key] === "object" && !Array.isArray(record[key])) && typeof record["readingPage"] === "number" && Number.isFinite(record["readingPage"]) && typeof record["bookPages"] === "number" && Number.isFinite(record["bookPages"]) && record["bookPages"] > 0 && typeof record["readingNotes"] === "string";
}

export function mondayOf(dateString: string) {
  const date = new Date(`${dateString}T12:00:00`);
  const weekday = date.getDay();
  date.setDate(date.getDate() - ((weekday + 6) % 7));
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export function canRescheduleWorkout(originalDate: string, targetDate: string, today: string) {
  // Any workout day (missed or upcoming) can move to another day, today or later, in the same week.
  if (!originalDate || !targetDate || !today) return false;
  return originalDate !== targetDate && targetDate >= today && mondayOf(originalDate) === mondayOf(targetDate) && mondayOf(targetDate) === mondayOf(today);
}

export type DayPlan = { day: string; title: string; type: string; exercises: string[] };
export function workoutForDate(date: string, reschedules: Record<string, string> = {}, overrides: Record<string, WorkoutOverride> = {}): DayPlan {
  const custom = overrides[date];
  if (custom?.exercises?.length) return custom;
  const weekdayIndex = (new Date(`${date}T12:00:00`).getDay() + 6) % 7;
  const regularDay = workoutSchedule[weekdayIndex] ?? workoutSchedule[0];
  if (!regularDay) return workoutSchedule[0]!;

  const movedFrom = Object.entries(reschedules).find(([, target]) => target === date)?.[0];
  if (movedFrom) {
    const sourceIndex = (new Date(`${movedFrom}T12:00:00`).getDay() + 6) % 7;
    return workoutSchedule[sourceIndex] ?? regularDay;
  }

  if (reschedules[date]) {
    const targetDate = reschedules[date];
    const targetLabel = targetDate ? new Date(`${targetDate}T12:00:00`).toLocaleDateString("en", { weekday: "long" }) : "another day";
    return { ...regularDay, title: `Workout moved to ${targetLabel}`, type: "Moved", exercises: ["This session is on its new day."] };
  }

  return regularDay;
}

/** A day's exercises after single-exercise moves: its own (minus moved-out) plus any moved in. */
export function exercisesForDate(date: string, plan: DayPlan, exerciseMoves: Record<string, string> = {}) {
  const own = plan.exercises.filter((ex) => !exerciseMoves[`${date}|${ex}`]).map((ex) => ({ ex, from: undefined as string | undefined }));
  const movedIn = Object.entries(exerciseMoves).filter(([k, to]) => to === date && !k.startsWith(`${date}|`)).map(([k]) => { const i = k.indexOf("|"); return { ex: k.slice(i + 1), from: k.slice(0, i) as string | undefined }; });
  // On a rest day, moved-in exercises replace the rest notes.
  const base = movedIn.length && !plan.type.startsWith("Workout") ? [] : own;
  return [...base, ...movedIn.filter((m) => !base.some((o) => o.ex === m.ex))];
}

export function weeklySpending(entries: PurchaseEntry[], date: string) {
  const monday = mondayOf(date);
  return entries.filter((entry) => entry.date >= monday && entry.date <= date).reduce((total, entry) => total + entry.amount, 0);
}

export function canAddPurchase(entries: PurchaseEntry[], date: string, amount: number) {
  return Number.isFinite(amount) && amount >= 0 && weeklySpending(entries, date) + amount <= WEEKLY_FOOD_LIMIT;
}

export function sleepMinutes(bedtime: string, wakeTime: string) {
  const [bedHour = 0, bedMinute = 0] = bedtime.split(":").map(Number);
  const [wakeHour = 0, wakeMinute = 0] = wakeTime.split(":").map(Number);
  let minutes = wakeHour * 60 + wakeMinute - (bedHour * 60 + bedMinute);
  if (minutes < 0) minutes += 24 * 60;
  return minutes;
}

export function minutesLabel(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return hours ? `${hours}h ${remainder}m` : `${remainder}m`;
}
export const HEIGHT_CM = 165;
export const DEFAULT_STEP_GOAL = 8000;

/** Rough distance from steps using a stride of ~41.5% of height. */
export function estimateKm(steps: number, heightCm = HEIGHT_CM) {
  if (!Number.isFinite(steps) || steps <= 0) return 0;
  return Math.round(((steps * heightCm * 0.415) / 100000) * 100) / 100;
}

/** Body weight keeps at most two decimals, e.g. 62.85. */
export function roundWeight(kg: number) {
  return Math.round(kg * 100) / 100;
}

/** Minutes between two date+time pairs; null when the wake time is not after bedtime or longer than 24h. */
export function sleepBetween(bedDate: string, bedTime: string, wakeDate: string, wakeTime: string) {
  const start = new Date(`${bedDate}T${bedTime}:00`).getTime();
  const end = new Date(`${wakeDate}T${wakeTime}:00`).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
  const minutes = Math.round((end - start) / 60000);
  return minutes > 0 && minutes <= 24 * 60 ? minutes : null;
}

export function addDays(date: string, days: number) {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export const defaultRoutine: RoutineItem[] = [
  { id: "wake", title: "Wake up", start: "08:00" },
  { id: "breakfast", title: "Breakfast", start: "08:30" },
  { id: "coding-1", title: "Coding session 1", start: "09:00", end: "11:00" },
  { id: "break-1", title: "Break", start: "11:00", end: "11:30" },
  { id: "coding-2", title: "Coding session 2", start: "11:30", end: "13:30" },
  { id: "lunch", title: "Lunch", start: "13:30" },
  { id: "rest", title: "Rest / personal time", start: "14:00", end: "15:00" },
  { id: "reading", title: "Atomic Habits reading", start: "15:00", end: "15:30" },
  { id: "workout", title: "Workout or recovery", start: "16:00", end: "17:00" },
  { id: "evening", title: "Shower, dinner, free time", start: "17:00", end: "19:00" },
  { id: "projects", title: "Personal projects / relaxation", start: "19:00", end: "21:30" },
  { id: "wind-down", title: "Wind down", start: "21:30", end: "23:30" },
  { id: "sleep", title: "Sleep", start: "23:45" },
];

export type ScheduledRoutineItem = RoutineItem & { time: string; movedFrom?: string; detail?: string | undefined };

export type RoutineContext = {
  /** Workout moves: missed date -> new date. */
  workoutMoves?: Record<string, string>;
  readingPages?: number | undefined;
  readingPage?: number | undefined;
  bookPages?: number | undefined;
};

/** What the routine's workout slot means on a given day, so rest days never say "workout". */
export function workoutRoutineTitle(plan: DayPlan) {
  if (plan.type.startsWith("Workout")) return plan.title;
  if (plan.type === "Recovery") return "Active recovery walk";
  if (plan.type === "Review") return "Rest day · weekly workout review";
  if (plan.type === "Moved") return `No workout · ${plan.title.replace("Workout moved", "moved")}`;
  return "Rest day · no workout";
}

export function readingRoutineTitle(pages: number) {
  return `Atomic Habits reading · ${pages} pages`;
}

/** Give the built-in workout and reading slots their real meaning for that day. */
function dressItem(item: RoutineItem, forDate: string, ctx: RoutineContext): Pick<ScheduledRoutineItem, "title" | "detail"> {
  if (item.id === "workout") {
    const plan = workoutForDate(forDate, ctx.workoutMoves ?? {});
    const isWorkout = plan.type.startsWith("Workout");
    return { title: workoutRoutineTitle(plan), detail: isWorkout ? `${plan.exercises.length} exercises` : plan.type === "Recovery" ? "Easy 20–30 minute walk" : "Recover — no training today" };
  }
  if (item.id === "reading") {
    const pages = Math.max(1, Math.round(ctx.readingPages ?? DEFAULT_READING_PAGES));
    const from = (ctx.readingPage ?? 0) + 1;
    const to = Math.min(ctx.bookPages ?? Infinity, from + pages - 1);
    return { title: readingRoutineTitle(pages), detail: ctx.readingPage !== undefined && from <= to ? `Pages ${from}–${to}` : undefined };
  }
  return { title: item.title };
}

/** The routine for one day: regular items minus skipped/moved-away ones, plus items moved onto this day. */
export function routineForDate(date: string, items: RoutineItem[], changes: Record<string, Record<string, RoutineChange>> = {}, ctx: RoutineContext = {}): ScheduledRoutineItem[] {
  const own = changes[date] ?? {};
  const list: ScheduledRoutineItem[] = items.filter((item) => !own[item.id]).map((item) => ({ ...item, ...dressItem(item, date, ctx), time: item.start }));
  for (const [fromDate, dayChanges] of Object.entries(changes)) {
    for (const [itemId, change] of Object.entries(dayChanges)) {
      if (change.action !== "move" || change.toDate !== date) continue;
      const item = items.find((entry) => entry.id === itemId);
      if (item) list.push({ ...item, ...dressItem(item, fromDate, ctx), id: `${item.id}@${fromDate}`, time: change.toTime, movedFrom: fromDate });
    }
  }
  return list.sort((a, b) => a.time.localeCompare(b.time));
}

/** Items whose reminder time falls in (windowStart, windowEnd] minutes of the given local day. */
export function dueRoutineItems(date: string, windowStartMinutes: number, windowEndMinutes: number, items: RoutineItem[], changes: Record<string, Record<string, RoutineChange>> = {}, ctx: RoutineContext = {}) {
  return routineForDate(date, items, changes, ctx).filter((item) => {
    const [h = 0, m = 0] = item.time.split(":").map(Number);
    const minutes = h * 60 + m;
    return minutes > windowStartMinutes && minutes <= windowEndMinutes;
  });
}

export type SetPlan = { count: number; low: number; high: number; timed: boolean };

/** Reads "3 × 10–12" or "3 × 30–45 sec" into sets and a rep/second range. */
export function parseSets(text: string | undefined): SetPlan | null {
  if (!text) return null;
  const m = /(\d+)\s*[×x]\s*(\d+)(?:\s*[–-]\s*(\d+))?\s*(sec|seconds|s\b)?/i.exec(text);
  if (!m) return null;
  const count = Number(m[1]), low = Number(m[2]), high = Number(m[3] ?? m[2]);
  if (!count || !low || count > 10) return null;
  return { count, low, high: Math.max(low, high), timed: !!m[4] };
}

/** True when every set/exercise scheduled on this date (including moved-in work) is logged. */
export function workoutDayComplete(data: FitTrackData, date: string) {
  const moves = data.rescheduledWorkouts ?? {};
  const overrides = data.workoutOverrides ?? {};
  const exerciseMoves = data.exerciseMoves ?? {};
  const plans = [workoutForDate(date, moves, overrides)];
  for (const [from, to] of Object.entries(moves)) if (to === date) plans.push(workoutForDate(from, {}, overrides));
  const exercises = new Set<string>();
  for (const plan of plans) for (const { ex } of exercisesForDate(date, plan, exerciseMoves)) exercises.add(ex);

  const entries = (data.workouts ?? []).filter((w) => w.date === date);
  for (const entry of entries) for (const ex of Object.keys(entry.sets ?? {})) exercises.add(ex);
  if (!exercises.size) return false;

  let counted = 0;
  for (const ex of exercises) {
    const expected = parseSets(ex.split(" · ")[1])?.count ?? 0;
    const logged = entries.reduce((max, entry) => Math.max(max, entry.sets?.[ex]?.length ?? 0), 0);
    const checked = entries.some((entry) => entry.completed.includes(ex));
    // Informational notes (rest day, commitment day) are not workouts.
    if (expected === 0 && logged === 0 && !checked) continue;
    counted++;
    if (expected > 0 ? logged < expected : !checked) return false;
  }
  return counted > 0;
}

/** True when a saved tracker has any real logs in it. */
export function hasLogs(d: FitTrackData) {
  return d.workouts.length + d.strength.length + d.sleep.length + d.weight.length + d.meals.length + d.purchases.length + d.coding.length + d.reading.length + (d.steps?.length ?? 0) + Object.keys(d.journal ?? {}).length + Object.keys(d.habits).length + Object.keys(d.routineDone ?? {}).length > 0 || d.readingPage > 0;
}

function keyOf(v: unknown) {
  if (v && typeof v === "object" && "id" in v && typeof (v as { id: unknown }).id === "string") return `id:${(v as { id: string }).id}`;
  return JSON.stringify(v);
}

function mergeValue(a: unknown, b: unknown): unknown {
  if (Array.isArray(a) && Array.isArray(b)) {
    const seen = new Map<string, unknown>();
    for (const v of [...a, ...b]) seen.set(keyOf(v), v);
    return [...seen.values()];
  }
  if (a && b && typeof a === "object" && typeof b === "object" && !Array.isArray(a) && !Array.isArray(b)) {
    const out: Record<string, unknown> = { ...(a as Record<string, unknown>) };
    for (const [k, v] of Object.entries(b as Record<string, unknown>)) out[k] = k in out ? mergeValue(out[k], v) : v;
    return out;
  }
  return b === undefined ? a : b;
}

/** Combine two trackers (e.g. phone + account copy) without losing entries; `b` wins on conflicting single values. */
export function mergeData(a: FitTrackData, b: FitTrackData): FitTrackData {
  const merged = mergeValue(a, b) as FitTrackData;
  // Lists that are one-per-day keep the newer copy for that day.
  const perDay = <T extends { date: string }>(list: T[], extra: (x: T) => string = () => "") => [...new Map(list.map((x) => [`${x.date}|${extra(x)}`, x])).values()];
  merged.workouts = perDay(merged.workouts, (w) => w.name);
  merged.sleep = perDay(merged.sleep);
  merged.weight = perDay(merged.weight);
  merged.strength = perDay(merged.strength);
  merged.readingPage = Math.max(a.readingPage, b.readingPage);
  if (a.routine?.length && b.routine?.length) merged.routine = b.routine;
  return merged;
}

export function emptyLearn(): LearnProgress {
  return { lessons: {}, topics: {}, projects: {} };
}

export function topicKey(date: string, topic: string) {
  return `${date}::${topic}`;
}

/** A topic counts as finished when the quiz has at least 2 right answers and the practice problem passed. */
export function topicFinished(progress?: TopicProgress) {
  return (progress?.quizScore ?? 0) >= 2 && !!progress?.problemReview?.passed;
}

/** Great-circle distance between two GPS points, in km. */
export function haversineKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const r = (d: number) => (d * Math.PI) / 180;
  const dLat = r(b.lat - a.lat), dLon = r(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

/** Pace as m:ss per km, or "—" when distance is zero. */
export function paceLabel(seconds: number, km: number) {
  if (!(km > 0) || !(seconds > 0)) return "—";
  const p = Math.round(seconds / km);
  return `${Math.floor(p / 60)}:${String(p % 60).padStart(2, "0")} /km`;
}

export function durationLabel(seconds: number) {
  const s = Math.max(0, Math.round(seconds));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}` : `${m}:${String(sec).padStart(2, "0")}`;
}

/** Running stride is longer than walking: ~0.65 × height. */
export function estimateRunSteps(km: number, heightCm = HEIGHT_CM) {
  if (!(km > 0)) return 0;
  return Math.round((km * 100000) / (heightCm * 0.65));
}

export function weeklyRunKm(runs: RunEntry[], weekStart: string) {
  const end = addDays(weekStart, 6);
  return Math.round(runs.filter((r) => r.date >= weekStart && r.date <= end).reduce((t, r) => t + r.km, 0) * 100) / 100;
}
