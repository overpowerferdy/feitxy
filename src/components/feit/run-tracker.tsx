import { useEffect, useRef, useState, type FormEvent } from "react";
import { Activity, Flag, MapPin, Pause, Play, Plus, Square, Target, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardTitle, Empty, Field, LogRow, ProgressBar } from "@/components/feit/ui";
import { durationLabel, estimateRunSteps, haversineKm, mondayOf, paceLabel, weeklyRunKm, type RunEntry } from "@/lib/fittrack-data";
import { fmtDate, newId, useFeit } from "@/lib/feit-store";

type Pt = { lat: number; lon: number };

export function RunSection() {
  const { data, update, today, notify } = useFeit();
  const runs = data.runs;
  const weekKm = weeklyRunKm(runs, mondayOf(today || "2026-11-16"));
  const longest = runs.reduce((m, r) => Math.max(m, r.km), 0);
  const fastest = runs.filter((r) => r.km >= 1).reduce<RunEntry | null>((b, r) => (!b || r.seconds / r.km < b.seconds / b.km ? r : b), null);

  function saveRun(run: Omit<RunEntry, "id">) {
    update((c) => ({
      ...c,
      runs: [...(c.runs ?? []), { ...run, id: newId() }].sort((a, b) => a.date.localeCompare(b.date)),
      steps: [...(c.steps ?? []), { id: newId(), date: run.date, steps: run.steps, km: run.km }].sort((a, b) => a.date.localeCompare(b.date)),
    }));
    notify(`Run saved · ${run.km.toFixed(2)} km. Steps added to your day.`);
  }

  return (
    <>
      <LiveRun onSave={saveRun} today={today} />
      <Card className="p-5 sm:p-6">
        <CardTitle icon={Target} title="This week" hint={`Goal ${data.runGoalKm} km`} action={
          <Input aria-label="Weekly km goal" className="h-8 w-20" type="number" min="1" step="1" value={data.runGoalKm} onChange={(e) => { const n = Number(e.target.value); if (n > 0) update((c) => ({ ...c, runGoalKm: n })); }} />
        } />
        <p className="text-4xl font-extrabold tabular-nums">{weekKm.toFixed(2)} <span className="text-lg text-muted-foreground">km</span></p>
        <div className="mt-3"><ProgressBar value={weekKm} max={data.runGoalKm} /></div>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-muted/60 p-3"><p className="flex items-center gap-1 text-muted-foreground"><Trophy size={14} />Longest</p><p className="font-bold">{longest ? `${longest.toFixed(2)} km` : "—"}</p></div>
          <div className="rounded-xl bg-muted/60 p-3"><p className="flex items-center gap-1 text-muted-foreground"><Flag size={14} />Best pace</p><p className="font-bold">{fastest ? paceLabel(fastest.seconds, fastest.km) : "—"}</p></div>
        </div>
      </Card>
      <ManualRun onSave={saveRun} today={today} />
      <Card className="p-5 sm:p-6">
        <CardTitle title="Run history" />
        <div className="divide-y divide-border">{runs.slice(-10).reverse().map((r) => (
          <LogRow key={r.id} what="run" title={`${r.km.toFixed(2)} km · ${durationLabel(r.seconds)}`} detail={`${fmtDate(r.date)} · ${paceLabel(r.seconds, r.km)} · ${r.steps.toLocaleString()} steps${r.source === "gps" ? " · GPS" : ""}`}
            onDelete={() => update((c) => ({ ...c, runs: (c.runs ?? []).filter((x) => x.id !== r.id) }))} />
        ))}</div>
        {!runs.length && <Empty>Your runs will appear here.</Empty>}
      </Card>
    </>
  );
}

function LiveRun({ onSave, today }: { onSave: (r: Omit<RunEntry, "id">) => void; today: string }) {
  const [state, setState] = useState<"idle" | "running" | "paused">("idle");
  const [km, setKm] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState("");
  const watch = useRef<number | null>(null);
  const last = useRef<Pt | null>(null);
  const startedAt = useRef(0);
  const held = useRef(0);

  useEffect(() => {
    if (state !== "running") return;
    const t = setInterval(() => setElapsed((held.current + Date.now() - startedAt.current) / 1000), 1000);
    return () => clearInterval(t);
  }, [state]);
  useEffect(() => () => stopWatch(), []);

  function stopWatch() { if (watch.current !== null) navigator.geolocation.clearWatch(watch.current); watch.current = null; last.current = null; }
  function startWatch() {
    if (!("geolocation" in navigator)) { setError("This device can't share its location. Log the run below instead."); return false; }
    watch.current = navigator.geolocation.watchPosition((pos) => {
      if (pos.coords.accuracy > 35) return; // ignore jumpy readings
      const p = { lat: pos.coords.latitude, lon: pos.coords.longitude };
      if (last.current) { const d = haversineKm(last.current, p); if (d > 0.003 && d < 0.2) setKm((k) => k + d); else if (d < 0.2) return; }
      last.current = p;
    }, (e) => setError(e.code === 1 ? "Location is blocked. Allow location for Feit to track runs." : "Can't find GPS signal yet — keep the app open outside."), { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 });
    return true;
  }
  function start() { setError(""); if (!startWatch()) return; startedAt.current = Date.now(); setState("running"); }
  function pause() { held.current += Date.now() - startedAt.current; stopWatch(); setState("paused"); }
  function finish() {
    if (state === "running") held.current += Date.now() - startedAt.current;
    stopWatch();
    const seconds = Math.round(held.current / 1000);
    const dist = Math.round(km * 100) / 100;
    if (dist > 0) onSave({ date: today, km: dist, seconds, steps: estimateRunSteps(dist), source: "gps" });
    held.current = 0; setKm(0); setElapsed(0); setState("idle");
  }

  return (
    <Card className="p-5 sm:p-6">
      <CardTitle icon={MapPin} title="Live run" hint="Keep Feit open on screen while you run — phones pause GPS for closed apps." />
      <div className="grid grid-cols-3 gap-2 text-center">
        <div><p className="text-3xl font-extrabold tabular-nums">{km.toFixed(2)}</p><p className="text-xs text-muted-foreground">km</p></div>
        <div><p className="text-3xl font-extrabold tabular-nums">{durationLabel(elapsed)}</p><p className="text-xs text-muted-foreground">time</p></div>
        <div><p className="text-3xl font-extrabold tabular-nums">{paceLabel(elapsed, km).replace(" /km", "")}</p><p className="text-xs text-muted-foreground">pace /km</p></div>
      </div>
      <p className="mt-2 text-center text-sm text-muted-foreground">≈ {estimateRunSteps(km).toLocaleString()} steps</p>
      {error && <p role="alert" className="mt-3 rounded-lg bg-destructive/10 p-2 text-sm text-destructive">{error}</p>}
      <div className="mt-4 flex gap-2">
        {state === "idle" && <Button className="flex-1" onClick={start}><Play size={16} />Start run</Button>}
        {state === "running" && <Button className="flex-1" variant="outline" onClick={pause}><Pause size={16} />Pause</Button>}
        {state === "paused" && <Button className="flex-1" onClick={start}><Play size={16} />Resume</Button>}
        {state !== "idle" && <Button className="flex-1" variant="secondary" onClick={finish}><Square size={16} />Finish</Button>}
      </div>
    </Card>
  );
}

function ManualRun({ onSave, today }: { onSave: (r: Omit<RunEntry, "id">) => void; today: string }) {
  const [km, setKm] = useState("");
  const [min, setMin] = useState("");
  const [steps, setSteps] = useState("");
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const k = Number(km), m = Number(min);
    if (!(k > 0) || !(m > 0)) return;
    const s = Math.round(Number(steps)) || estimateRunSteps(k);
    onSave({ date: String(f.get("date") || today), km: Math.round(k * 100) / 100, seconds: Math.round(m * 60), steps: s, source: "manual" });
    setKm(""); setMin(""); setSteps("");
  }
  return (
    <Card className="p-5 sm:p-6">
      <CardTitle icon={Plus} title="Log a run" hint="Treadmill or watch run? Enter it here." />
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
        <Field label="Day"><Input name="date" type="date" defaultValue={today} required /></Field>
        <Field label="Distance · km"><Input inputMode="decimal" type="number" min="0.01" step="0.01" placeholder="e.g. 3.5" value={km} required onChange={(e) => setKm(e.target.value)} /></Field>
        <Field label="Time · minutes"><Input inputMode="decimal" type="number" min="1" step="0.1" placeholder="e.g. 22" value={min} required onChange={(e) => setMin(e.target.value)} /></Field>
        <Field label="Steps" hint={km ? `Leave empty for ≈ ${estimateRunSteps(Number(km)).toLocaleString()}` : "Optional"}><Input inputMode="numeric" type="number" min="0" step="1" value={steps} onChange={(e) => setSteps(e.target.value)} /></Field>
        <p className="text-sm text-muted-foreground sm:col-span-2"><Activity size={14} className="mr-1 inline" />Pace: {paceLabel(Number(min) * 60, Number(km))}</p>
        <Button type="submit" className="sm:col-span-2"><Plus size={16} />Save run</Button>
      </form>
    </Card>
  );
}
