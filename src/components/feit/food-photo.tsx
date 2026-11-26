import { useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Camera, ExternalLink, Images, Leaf, Loader2, Plus, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardTitle } from "@/components/feit/ui";
import { compressImage } from "@/lib/photo-store";
import { analyzeFood, type FoodAnalysis } from "@/lib/food.functions";
import { newId, useFeit } from "@/lib/feit-store";

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

function mealForNow() {
  const h = new Date().getHours();
  return h < 10 ? "Breakfast" : h < 15 ? "Lunch" : h < 18 ? "Snack" : "Dinner";
}

/** Snap or pick a food photo; the AI estimates nutrition and what it does for you. */
export function FoodPhotoCard() {
  const { session, authReady, update, today, notify } = useFeit();
  const run = useServerFn(analyzeFood);
  const camera = useRef<HTMLInputElement>(null);
  const gallery = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState("");
  const [image, setImage] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<FoodAnalysis | null>(null);

  async function pick(files: FileList | null) {
    const file = files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setError(""); setResult(null);
    try {
      const url = await blobToDataUrl(await compressImage(file, 1024));
      setPreview(url); setImage(url);
      void check(url);
    } catch { setError("That photo couldn't be opened. Try another one."); }
  }
  async function check(img = image) {
    if (!img) return;
    setBusy(true); setError("");
    try { setResult(await run({ data: { image: img, ...(note.trim() ? { note: note.trim() } : {}) } })); }
    catch (e) { const m = e instanceof Error ? e.message : ""; setError(/unauthori|401|jwt/i.test(m) ? "Your sign-in expired. Please sign in again." : m || "The food check didn't work. Please try again."); }
    setBusy(false);
  }
  function addMeal() {
    if (!result) return;
    update((c) => ({ ...c, meals: [...c.meals, { id: newId(), date: today, type: mealForNow(), food: result.food, portion: result.portion, protein: Math.round(result.protein) }] }));
    notify(`${result.food} added to today's meals.`);
  }
  function clear() { setPreview(""); setImage(""); setResult(null); setError(""); setNote(""); }

  const signedOut = authReady && !session;
  return (
    <Card className="p-5 sm:p-6">
      <CardTitle icon={Sparkles} title="What's in my food?" hint="Take or pick a photo — the AI estimates nutrition and how it helps your training." />
      {signedOut ? (
        <div className="rounded-xl bg-muted/60 p-4 text-sm"><p>Sign in once on this device to check food photos.</p><Button asChild size="sm" className="mt-3"><Link to="/auth">Sign in</Link></Button></div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <Input placeholder="Optional: what is it? e.g. tinola, 1 bowl" value={note} maxLength={200} onChange={(e) => setNote(e.target.value)} aria-label="Food description (optional)" />
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" onClick={() => camera.current?.click()} disabled={busy}><Camera size={16} />Take photo</Button>
              <Button type="button" variant="outline" onClick={() => gallery.current?.click()} disabled={busy}><Images size={16} />Gallery</Button>
            </div>
          </div>
          <input ref={camera} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { void pick(e.target.files); e.target.value = ""; }} />
          <input ref={gallery} type="file" accept="image/*" className="hidden" aria-label="Choose a food photo" onChange={(e) => { void pick(e.target.files); e.target.value = ""; }} />

          {preview && (
            <div className="mt-4 grid gap-4 sm:grid-cols-[180px_minmax(0,1fr)]">
              <div className="relative">
                <img src={preview} alt="Your food" className="aspect-square w-full rounded-xl object-cover sm:w-[180px]" />
                <button type="button" aria-label="Remove photo" onClick={clear} className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-background/90 text-foreground"><X size={14} /></button>
              </div>
              <div className="min-w-0">
                {busy && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 size={16} className="animate-spin" />Looking at your food…</p>}
                {error && <div className="text-sm"><p className="text-destructive">{error}</p><Button size="sm" variant="outline" className="mt-2" onClick={() => check()}>Try again</Button></div>}
                {result && !busy && (result.isFood ? <FoodResult r={result} onAdd={addMeal} onRecheck={() => check()} /> : <p className="text-sm">I couldn't spot food in this photo. Try a closer picture of your plate.</p>)}
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  );
}

function FoodResult({ r, onAdd, onRecheck }: { r: FoodAnalysis; onAdd: () => void; onRecheck: () => void }) {
  let source: string | null = null;
  try { if (r.sourceUrl) { const u = new URL(r.sourceUrl); if (["http:", "https:"].includes(u.protocol)) source = u.href; } } catch { source = null; }
  const macros: [string, number, string][] = [["Protein", r.protein, "g"], ["Carbs", r.carbs, "g"], ["Fat", r.fat, "g"], ["Fiber", r.fiber, "g"]];
  return (
    <div className="grid gap-3 text-sm">
      <div>
        <p className="text-lg font-extrabold leading-tight">{r.food}</p>
        <p className="text-muted-foreground">{r.portion} · about <strong className="text-foreground">{Math.round(r.calories)} kcal</strong>{r.confidence !== "high" ? ` · ${r.confidence} confidence` : ""}</p>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {macros.map(([label, value, unit]) => <div key={label} className={`rounded-xl p-2 text-center ${label === "Protein" ? "bg-primary text-primary-foreground" : "bg-muted"}`}><p className="text-base font-extrabold tabular-nums">{Math.round(value)}{unit}</p><p className="text-[0.7rem] font-semibold opacity-80">{label}</p></div>)}
      </div>
      {r.benefits.length > 0 && <div><p className="mb-1 text-xs font-bold uppercase text-primary">What it gives you</p><ul className="grid gap-1">{r.benefits.map((b) => <li key={b} className="flex gap-2"><Leaf size={14} className="mt-0.5 shrink-0 text-primary" />{b}</li>)}</ul></div>}
      {r.nutrients.length > 0 && <div className="flex flex-wrap gap-1.5">{r.nutrients.map((n) => <span key={n} className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">{n}</span>)}</div>}
      {r.tips.length > 0 && <div><p className="mb-1 text-xs font-bold uppercase text-primary">Make it better</p><ul className="grid gap-1">{r.tips.map((t) => <li key={t}>• {t}</li>)}</ul></div>}
      <p className="text-xs text-muted-foreground">Estimates from a photo — use them as a guide, not exact numbers.</p>
      {source && <a href={source} target="_blank" rel="noopener noreferrer" className="inline-flex w-fit items-center gap-1.5 rounded-lg bg-muted px-3 py-2 text-xs font-bold text-primary hover:bg-secondary"><ExternalLink size={13} />Reference: {r.sourceName || "nutrition source"}</a>}
      <div className="flex flex-wrap gap-2"><Button size="sm" onClick={onAdd}><Plus size={15} />Add to today's meals</Button><Button size="sm" variant="ghost" onClick={onRecheck}>Check again</Button></div>
    </div>
  );
}
