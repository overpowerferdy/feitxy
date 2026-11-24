import { useEffect, useRef, useState } from "react";
import { Check, Minus, Pause, Pencil, Play, Plus, Trash2, RotateCcw, SkipForward, Timer, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { parseSets } from "@/lib/fittrack-data";

const REST_SECONDS = 90;

function clock(sec: number) {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** Short beep + buzz so you notice without looking at the screen. */
function signal() {
  try { navigator.vibrate?.([180, 80, 180]); } catch { /* not supported */ }
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.frequency.value = 880; gain.gain.value = 0.08;
    osc.connect(gain).connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.25);
    osc.onended = () => void ctx.close();
  } catch { /* audio blocked */ }
}

function useTick(active: boolean) {
  const [, setN] = useState(0);
  useEffect(() => {
    if (!active) return;
    const t = window.setInterval(() => setN((n) => n + 1), 250);
    return () => window.clearInterval(t);
  }, [active]);
}

/** Per-set logging: a reps counter (or a timer for timed holds) and a rest countdown between sets. */
export function SetTracker({ name, sets, logged, onChange }: { name: string; sets?: string | undefined; logged: number[]; onChange: (next: number[]) => void }) {
  const plan = parseSets(sets);
  const [reps, setReps] = useState(plan?.low ?? 10);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [heldMs, setHeldMs] = useState(0);
  const [restEnd, setRestEnd] = useState<number | null>(null);
  const [editing, setEditing] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const beeped = useRef({ low: false, high: false, rest: false });
  const running = startedAt !== null;
  useTick(running || restEnd !== null);
  if (!plan) return null;

  const elapsed = (heldMs + (running ? Date.now() - startedAt : 0)) / 1000;
  const restLeft = restEnd ? (restEnd - Date.now()) / 1000 : 0;
  if (running && plan.timed) {
    if (!beeped.current.low && elapsed >= plan.low) { beeped.current.low = true; signal(); }
    if (!beeped.current.high && elapsed >= plan.high) { beeped.current.high = true; signal(); }
  }
  if (restEnd && restLeft <= 0 && !beeped.current.rest) { beeped.current.rest = true; signal(); window.setTimeout(() => setRestEnd(null), 0); }

  const doneAll = logged.length >= plan.count;
  const unit = plan.timed ? "sec" : "reps";
  function resetTimer() { setStartedAt(null); setHeldMs(0); beeped.current.low = false; beeped.current.high = false; }
  function logSet() {
    const value = plan!.timed ? Math.round(elapsed) || plan!.low : reps;
    const next = [...logged, value];
    onChange(next);
    resetTimer();
    if (next.length < plan!.count) { beeped.current.rest = false; setRestEnd(Date.now() + REST_SECONDS * 1000); } else setRestEnd(null);
  }

  return (
    <div className="mt-3 rounded-xl bg-muted/60 p-3" aria-label={`${name} sets`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Sets · {plan.low === plan.high ? plan.low : `${plan.low}–${plan.high}`} {unit}</p>
        <span className="text-xs font-semibold tabular-nums">{Math.min(logged.length, plan.count)} / {plan.count}</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {Array.from({ length: Math.max(plan.count, logged.length) }, (_, i) => {
          const value = logged[i];
          const current = i === logged.length;
          if (value !== undefined) return <button type="button" key={i} onClick={() => { setEditing(i); setDraft(String(value)); }} aria-label={`Edit set ${i + 1}: ${value} ${unit}`} className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-bold tabular-nums ${editing === i ? "ring-2 ring-ring " : ""}bg-primary text-primary-foreground`}>{value}</button>;
          return <span key={i} className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-bold tabular-nums transition-colors ${value !== undefined ? "feit-pop bg-primary text-primary-foreground" : current ? "border-2 border-primary bg-card text-foreground" : "border border-border bg-card text-muted-foreground"}`} title={value !== undefined ? `Set ${i + 1}: ${value} ${unit}` : `Set ${i + 1}`}>{value ?? i + 1}</span>;
        })}
      </div>

      {editing !== null && logged[editing] !== undefined && (
        <form className="mt-2 flex flex-wrap items-center gap-2 rounded-lg bg-card p-2" onSubmit={(e) => { e.preventDefault(); const v = Math.round(Number(draft)); if (!Number.isFinite(v) || v < 0) return; onChange(logged.map((x, i) => (i === editing ? v : x))); setEditing(null); }}>
          <Pencil size={14} className="text-muted-foreground" />
          <label className="text-xs font-semibold" htmlFor={`${name}-edit`}>Set {editing + 1}</label>
          <input id={`${name}-edit`} type="number" inputMode="numeric" min={0} value={draft} onChange={(e) => setDraft(e.target.value)} className="h-8 w-20 rounded-md border border-input bg-background px-2 text-sm font-bold" />
          <span className="text-xs text-muted-foreground">{unit}</span>
          <Button type="submit" size="sm" className="h-8 px-2.5 text-xs"><Check size={14} />Save</Button>
          <Button type="button" size="sm" variant="ghost" className="h-8 px-2.5 text-xs" onClick={() => { onChange(logged.filter((_, i) => i !== editing)); setEditing(null); }}><Trash2 size={14} />Delete</Button>
          <Button type="button" size="sm" variant="ghost" className="h-8 px-2.5 text-xs" onClick={() => setEditing(null)}>Cancel</Button>
        </form>
      )}

      {restEnd !== null && restLeft > 0 && (
        <div className="mt-3 flex items-center justify-between gap-2 rounded-lg bg-accent/60 px-3 py-2 text-accent-foreground">
          <span className="flex items-center gap-2 text-sm font-bold"><Timer size={16} />Rest {clock(restLeft)}</span>
          <div className="flex gap-1">
            <Button type="button" size="sm" variant="ghost" className="h-8 px-2 text-xs" onClick={() => setRestEnd((e) => (e ?? Date.now()) + 30000)}>+30s</Button>
            <Button type="button" size="sm" variant="ghost" className="h-8 px-2 text-xs" onClick={() => setRestEnd(null)}><SkipForward size={14} />Skip</Button>
          </div>
        </div>
      )}

      {!doneAll ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {plan.timed ? (
            <>
              <span className={`min-w-16 text-2xl font-extrabold tabular-nums ${elapsed >= plan.low ? "text-primary" : ""}`}>{clock(elapsed)}</span>
              <Button type="button" size="sm" variant="outline" onClick={() => { if (running) { setHeldMs((h) => h + Date.now() - startedAt); setStartedAt(null); } else setStartedAt(Date.now()); }}>{running ? <><Pause size={14} />Pause</> : <><Play size={14} />{elapsed > 0 ? "Resume" : "Start"}</>}</Button>
              {elapsed > 0 && !running && <Button type="button" size="icon" variant="ghost" className="size-8" aria-label="Reset timer" onClick={resetTimer}><RotateCcw size={14} /></Button>}
            </>
          ) : (
            <div className="flex items-center rounded-lg border border-border bg-card">
              <Button type="button" size="icon" variant="ghost" className="size-9" aria-label="One less rep" onClick={() => setReps((r) => Math.max(0, r - 1))}><Minus size={16} /></Button>
              <span className="min-w-14 text-center text-lg font-extrabold tabular-nums" aria-live="polite">{reps}<span className="ml-1 text-xs font-semibold text-muted-foreground">reps</span></span>
              <Button type="button" size="icon" variant="ghost" className="size-9" aria-label="One more rep" onClick={() => setReps((r) => r + 1)}><Plus size={16} /></Button>
            </div>
          )}
          <Button type="button" size="sm" className="ml-auto" onClick={logSet}>Log set {logged.length + 1}</Button>
        </div>
      ) : <div className="mt-3 flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-semibold text-primary">All {plan.count} sets done — nice work!</p><Button type="button" size="sm" variant="outline" className="h-8 px-2.5 text-xs" onClick={() => onChange([...logged, plan.timed ? plan.low : reps])}><Plus size={14} />Extra set</Button></div>}
      {logged.length > 0 && editing === null && <p className="mt-2 text-xs text-muted-foreground">Tap a logged set to change or delete it.</p>}

      {logged.length > 0 && <button type="button" className="mt-2 flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground" onClick={() => { onChange(logged.slice(0, -1)); setRestEnd(null); }}><Undo2 size={12} />Undo last set</button>}
    </div>
  );
}
