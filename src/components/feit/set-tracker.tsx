import { useEffect, useRef, useState } from "react";
import { Minus, Pause, Play, Plus, RotateCcw, SkipForward, Timer, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { parseSets } from "@/lib/fittrack-data";
import { playTimerAlert } from "@/lib/timer-sound";

const REST_SECONDS = 90;

function clock(sec: number) {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function useTick(active: boolean) {
  const [, setN] = useState(0);
  useEffect(() => {
    if (!active) return;
    const t = window.setInterval(() => setN((n) => n + 1), 250);
    return () => window.clearInterval(t);
  }, [active]);
}

/** Per-set logging: reps + kg (or a timer for holds), and a rest countdown between sets. */
export function SetTracker({ name, sets, logged, weights = [], onChange }: { name: string; sets?: string | undefined; logged: number[]; weights?: number[] | undefined; onChange: (next: number[], nextWeights: number[]) => void }) {
  const plan = parseSets(sets);
  const [reps, setReps] = useState(plan?.low ?? 10);
  const [kg, setKg] = useState(() => {
    const last = weights[weights.length - 1];
    return last && last > 0 ? String(last) : "";
  });
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [heldMs, setHeldMs] = useState(0);
  const [restEnd, setRestEnd] = useState<number | null>(null);
  const beeped = useRef({ low: false, high: false, rest: false, finish: false });
  const running = startedAt !== null;
  useTick(running || restEnd !== null);
  if (!plan) return null;

  const elapsed = (heldMs + (running ? Date.now() - startedAt : 0)) / 1000;
  const restLeft = restEnd ? (restEnd - Date.now()) / 1000 : 0;
  if (running && plan.timed) {
    if (!beeped.current.low && elapsed >= plan.low) { beeped.current.low = true; playTimerAlert("finish"); }
    if (!beeped.current.high && elapsed >= plan.high) { beeped.current.high = true; playTimerAlert("finish"); }
  }
  if (restEnd && restLeft <= 0 && !beeped.current.rest) { beeped.current.rest = true; playTimerAlert("rest"); window.setTimeout(() => setRestEnd(null), 0); }

  const doneAll = logged.length >= plan.count;
  const unit = plan.timed ? "sec" : "reps";
  function resetTimer() { setStartedAt(null); setHeldMs(0); beeped.current.low = false; beeped.current.high = false; }
  function weightValues() {
    const value = Number(kg);
    return [...weights, Number.isFinite(value) && value > 0 ? Math.round(value * 100) / 100 : 0];
  }
  function logSet() {
    const value = plan!.timed ? Math.round(elapsed) || plan!.low : reps;
    onChange([...logged, value], plan!.timed ? [...weights, 0] : weightValues());
    resetTimer();
    if (logged.length + 1 >= plan!.count) { setRestEnd(null); playTimerAlert("finish"); }
    else { beeped.current.rest = false; setRestEnd(Date.now() + REST_SECONDS * 1000); }
  }

  return (
    <div className="mt-3 rounded-xl bg-muted/60 p-3" aria-label={`${name} sets`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Sets · {plan.low === plan.high ? plan.low : `${plan.low}–${plan.high}`} {unit}</p>
        <span className="text-xs font-semibold tabular-nums">{Math.min(logged.length, plan.count)} / {plan.count}</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {Array.from({ length: plan.count }, (_, i) => {
          const value = logged[i];
          const kgValue = weights[i];
          const current = i === logged.length;
          return <span key={i} className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-bold tabular-nums transition-colors ${value !== undefined ? "feit-pop bg-primary text-primary-foreground" : current ? "border-2 border-primary bg-card text-foreground" : "border border-border bg-card text-muted-foreground"}`} title={value !== undefined ? `Set ${i + 1}: ${value} ${unit}${kgValue ? ` · ${kgValue} kg` : ""}` : `Set ${i + 1}`}>{value ?? i + 1}</span>;
        })}
      </div>

      {restEnd !== null && restLeft > 0 && (
        <div className="mt-3 flex items-center justify-between gap-2 rounded-lg bg-accent/60 px-3 py-2 text-accent-foreground" aria-live="polite">
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
            <>
              <div className="flex items-center rounded-lg border border-border bg-card">
                <Button type="button" size="icon" variant="ghost" className="size-9" aria-label="One less rep" onClick={() => setReps((r) => Math.max(0, r - 1))}><Minus size={16} /></Button>
                <span className="min-w-14 text-center text-lg font-extrabold tabular-nums" aria-live="polite">{reps}<span className="ml-1 text-xs font-semibold text-muted-foreground">reps</span></span>
                <Button type="button" size="icon" variant="ghost" className="size-9" aria-label="One more rep" onClick={() => setReps((r) => r + 1)}><Plus size={16} /></Button>
              </div>
              <label className="flex items-center gap-1 rounded-lg border border-border bg-card px-2 text-xs font-bold text-muted-foreground">kg
                <Input type="number" inputMode="decimal" min="0" step="0.5" placeholder="—" value={kg} onChange={(e) => setKg(e.target.value)} aria-label={`Weight in kg for ${name}`} className="h-9 w-16 border-0 bg-transparent px-0 text-center text-sm font-extrabold text-foreground" />
              </label>
            </>
          )}
          <Button type="button" size="sm" className="ml-auto" onClick={logSet}>Log set {logged.length + 1}</Button>
        </div>
      ) : <p className="mt-3 text-sm font-semibold text-primary">All {plan.count} sets done — nice work!</p>}

      {logged.length > 0 && <button type="button" className="mt-2 flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground" onClick={() => { onChange(logged.slice(0, -1), weights.slice(0, -1)); setRestEnd(null); }}><Undo2 size={12} />Undo last set</button>}
    </div>
  );
}
