import { useState } from "react";
import { ArrowRight, Check, Image as ImageIcon, Link2, Play, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { SetTracker } from "@/components/feit/set-tracker";
import { fmtDate } from "@/lib/feit-store";

const images = import.meta.glob("@/assets/exercises/*.jpg", { eager: true, import: "default" }) as Record<string, string>;
const img = (name: string) => Object.entries(images).find(([k]) => k.endsWith(`/${name}.jpg`))?.[1];

// [match text, picture, form cue, YouTube video id]
export const exerciseGuides: [string, string, string, string | null][] = [
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
export const guide = (exercise: string) => exerciseGuides.find(([k]) => exercise.includes(k));
export const exerciseKey = (exercise: string) => exercise.split(" · ")[0]?.trim().toLowerCase() ?? "";

/** Accepts a YouTube URL, nocookie embed URL, or a bare 11-character video ID. */
export function videoIdFrom(input: string) {
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

export function ExerciseCard({ ex, checked, onToggle, canCheck, logged, weights, onLog, moveDays, onMove, movedFrom, onMoveBack, videoId, onSaveVideo }: {
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
