import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { createEmptyData, defaultRoutine, DEFAULT_READING_PAGES, DEFAULT_STEP_GOAL, emptyLearn, hasLogs, isFitTrackData, mergeData, STORAGE_KEY, type FitTrackData, type RoutineContext } from "@/lib/fittrack-data";
import { focusLockSupported } from "@/lib/focus-lock";

export type ThemeChoice = "light" | "dark" | "device";
const THEME_KEY = "fittrack-theme";
/** When this device last changed the logs (ISO time), used to decide which copy is newer. */
const SAVED_AT_KEY = "fittrack-saved-at";
/** Which account this device's logs were last synced with. */
const SYNCED_USER_KEY = "fittrack-synced-user";
/** Active focus session. Kept on device so a reload cannot silently unlock the app. */
const FOCUS_KEY = "fittrack-focus";

export type FocusSession = { date: string; durationSec: number; startedAt: number; endsAt: number; lockRequested?: boolean };

function readFocus(): FocusSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(FOCUS_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<FocusSession>;
    if (typeof value.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value.date) && typeof value.durationSec === "number" && value.durationSec > 0 && typeof value.startedAt === "number" && typeof value.endsAt === "number" && Number.isFinite(value.endsAt)) return value as FocusSession;
  } catch { /* ignore stale focus state */ }
  return null;
}

export type SyncState = "off" | "syncing" | "synced" | "error";

export function localDate(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Fill optional fields so every screen can rely on them. */
export function withDefaults(data: FitTrackData): Required<FitTrackData> {
  return {
    ...data,
    rescheduledWorkouts: data.rescheduledWorkouts ?? {},
    workoutOverrides: data.workoutOverrides ?? {},
    videoLinks: data.videoLinks ?? {},
    exerciseMoves: data.exerciseMoves ?? {},
    steps: data.steps ?? [],
    runs: data.runs ?? [],
    runGoalKm: data.runGoalKm ?? 10,
    journal: data.journal ?? {},
    routine: data.routine?.length ? data.routine : defaultRoutine,
    routineDone: data.routineDone ?? {},
    routineChanges: data.routineChanges ?? {},
    learn: { ...emptyLearn(), ...(data.learn ?? {}) },
    stepGoal: data.stepGoal ?? DEFAULT_STEP_GOAL,
    remindersOn: data.remindersOn ?? false,
    focusLockOn: data.focusLockOn ?? true,
    readingGoal: data.readingGoal ?? DEFAULT_READING_PAGES,
  };
}

type Store = {
  data: Required<FitTrackData>;
  update: (updater: (current: Required<FitTrackData>) => FitTrackData) => void;
  replace: (data: FitTrackData) => void;
  today: string;
  hydrated: boolean;
  notice: string;
  notify: (message: string) => void;
  theme: ThemeChoice;
  setTheme: (theme: ThemeChoice) => void;
  isDark: boolean;
  session: Session | null;
  authReady: boolean;
  sync: SyncState;
  lastSynced: string;
  routineCtx: RoutineContext;
  focus: FocusSession | null;
  startFocus: (date: string, durationSec: number, lock?: boolean) => void;
  endFocus: () => void;
};

const StoreContext = createContext<Store | null>(null);

export function FeitProvider({ children }: { children: ReactNode }) {
  const [raw, setRaw] = useState<FitTrackData>(() => createEmptyData());
  const [today, setToday] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [notice, setNotice] = useState("");
  const [theme, setThemeState] = useState<ThemeChoice>("device");
  const [isDark, setIsDark] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [sync, setSync] = useState<SyncState>("off");
  const [lastSynced, setLastSynced] = useState("");
  const [focus, setFocus] = useState<FocusSession | null>(() => readFocus());
  const savedAt = useRef("");
  const skipUpload = useRef(false);
  const cloudReady = useRef(false);
  const rawRef = useRef(raw);
  rawRef.current = raw;

  useEffect(() => {
    setToday(localDate());
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (isFitTrackData(parsed)) setRaw(parsed);
      }
    } catch {
      setNotice("Saved data could not be read; a fresh tracker is ready.");
    }
    savedAt.current = window.localStorage.getItem(SAVED_AT_KEY) ?? "";
    const saved = window.localStorage.getItem(THEME_KEY);
    if (saved === "light" || saved === "dark") setThemeState(saved);
    setHydrated(true);
    const timer = window.setInterval(() => setToday(localDate()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => { setSession(next); setAuthReady(true); });
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setAuthReady(true); });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const dark = theme === "device" ? media.matches : theme === "dark";
      document.documentElement.classList.toggle("dark", dark);
      setIsDark(dark);
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [theme]);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(raw));
  }, [raw, hydrated]);

  // ---- Account sync: the signed-in account keeps a copy of the logs so every device gets them. ----
  const userId = session?.user.id ?? "";
  const markLocal = useCallback(() => {
    savedAt.current = new Date().toISOString();
    window.localStorage.setItem(SAVED_AT_KEY, savedAt.current);
  }, []);
  const push = useCallback(async (uid: string) => {
    setSync("syncing");
    const at = savedAt.current || new Date().toISOString();
    const { error } = await supabase.from("user_data").upsert({ user_id: uid, data: rawRef.current as never, updated_at: at }, { onConflict: "user_id" });
    if (error) { setSync("error"); return; }
    setSync("synced");
    setLastSynced(new Date().toISOString());
  }, []);
  const applyCloud = useCallback((next: FitTrackData, at: string) => {
    skipUpload.current = true;
    savedAt.current = at;
    window.localStorage.setItem(SAVED_AT_KEY, at);
    setRaw(next);
  }, []);
  const pull = useCallback(async (uid: string, first: boolean) => {
    setSync("syncing");
    const { data: row, error } = await supabase.from("user_data").select("data, updated_at").eq("user_id", uid).maybeSingle();
    if (error) { setSync("error"); return; }
    const local = rawRef.current;
    const joinedBefore = window.localStorage.getItem(SYNCED_USER_KEY) === uid;
    if (!row || !isFitTrackData(row.data)) {
      await push(uid);
    } else if (first && !joinedBefore) {
      // First time this device meets this account: keep entries from both sides.
      if (hasLogs(local)) {
        const merged = mergeData(row.data, local);
        markLocal();
        skipUpload.current = true;
        setRaw(merged);
        rawRef.current = merged;
        await push(uid);
      } else applyCloud(row.data, new Date(row.updated_at).toISOString());
    } else {
      const cloudAt = Date.parse(row.updated_at), localAt = Date.parse(savedAt.current || "0");
      if (cloudAt > localAt) applyCloud(row.data, new Date(cloudAt).toISOString());
      else if (localAt > cloudAt) { await push(uid); return; }
    }
    window.localStorage.setItem(SYNCED_USER_KEY, uid);
    cloudReady.current = true;
    setSync("synced");
    setLastSynced(new Date().toISOString());
  }, [applyCloud, markLocal, push]);

  useEffect(() => {
    cloudReady.current = false;
    if (!hydrated || !userId) { setSync("off"); return; }
    void pull(userId, true);
    const refresh = () => { if (document.visibilityState === "visible" && cloudReady.current) void pull(userId, false); };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => { window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", refresh); };
  }, [hydrated, userId, pull]);

  useEffect(() => {
    if (skipUpload.current) { skipUpload.current = false; return; }
    if (!cloudReady.current || !userId) return;
    const t = window.setTimeout(() => void push(userId), 1500);
    return () => window.clearTimeout(t);
  }, [raw, userId, push]);

  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(""), 3800);
    return () => window.clearTimeout(t);
  }, [notice]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (focus) window.localStorage.setItem(FOCUS_KEY, JSON.stringify(focus));
    else window.localStorage.removeItem(FOCUS_KEY);
  }, [focus]);

  const data = useMemo(() => withDefaults(raw), [raw]);
  const update = useCallback((updater: (current: Required<FitTrackData>) => FitTrackData) => { markLocal(); setRaw((current) => updater(withDefaults(current))); }, [markLocal]);
  const replace = useCallback((next: FitTrackData) => { markLocal(); setRaw(next); }, [markLocal]);
  const routineCtx = useMemo<RoutineContext>(() => ({ workoutMoves: data.rescheduledWorkouts, readingPages: data.readingGoal, readingPage: data.readingPage, bookPages: data.bookPages }), [data.rescheduledWorkouts, data.readingGoal, data.readingPage, data.bookPages]);
  const setTheme = useCallback((next: ThemeChoice) => {
    if (next === "device") window.localStorage.removeItem(THEME_KEY); else window.localStorage.setItem(THEME_KEY, next);
    setThemeState(next);
  }, []);
  const startFocus = useCallback((date: string, durationSec: number, lock = false) => {
    const seconds = Math.min(3 * 60 * 60, Math.max(60, Math.round(durationSec)));
    const now = Date.now();
    setFocus({ date, durationSec: seconds, startedAt: now, endsAt: now + seconds * 1000, lockRequested: focusLockSupported && lock });
  }, []);
  const endFocus = useCallback(() => setFocus(null), []);

  const value: Store = { data, update, replace, today, hydrated, notice, notify: setNotice, theme, setTheme, isDark, session, authReady, sync, lastSynced, routineCtx, focus, startFocus, endFocus };
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useFeit() {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useFeit must be used inside FeitProvider");
  return store;
}

export function fmtDate(date: string, opts: Intl.DateTimeFormatOptions = { weekday: "short", month: "short", day: "numeric" }) {
  return date ? new Date(`${date}T12:00:00`).toLocaleDateString("en", opts) : "";
}

export function fmtTime(time: string) {
  const [h = 0, m = 0] = time.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}
