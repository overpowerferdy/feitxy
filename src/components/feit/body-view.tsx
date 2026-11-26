import { useState, type FormEvent } from "react";
import { Activity, BedDouble, Footprints, Plus, Scale, Sunrise, Utensils, Wallet } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardTitle, Empty, Field, LogRow, PageHeader, ProgressBar, Segmented, selectClass } from "@/components/feit/ui";
import { addDays, canAddPurchase, estimateKm, minutesLabel, mondayOf, roundWeight, sleepBetween, SLEEP_TARGET_MINUTES, WEEKLY_FOOD_LIMIT, weeklySpending } from "@/lib/fittrack-data";
import { fmtDate, fmtTime, newId, useFeit } from "@/lib/feit-store";
import { RunSection } from "@/components/feit/run-tracker";
import { FoodPhotoCard } from "@/components/feit/food-photo";

type Tab = "steps" | "sleep" | "weight" | "food";
const tooltipStyle = { background: "var(--color-card)", borderColor: "var(--color-border)", borderRadius: 10 };
const tick = { fill: "var(--color-muted-foreground)", fontSize: 11 };

export function BodyView() {
  const [tab, setTab] = useState<Tab>("steps");
  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Take care of yourself" title="Body" subtitle="Movement, sleep, weight and food — log what really happened." />
      <Segmented label="Body sections" value={tab} onChange={setTab} options={[{ value: "steps", label: "Movement", icon: Footprints }, { value: "sleep", label: "Sleep", icon: BedDouble }, { value: "weight", label: "Weight", icon: Scale }, { value: "food", label: "Food", icon: Utensils }]} />
      <div key={tab} className="feit-stagger space-y-5">
        {tab === "steps" && <><StepsSection /><RunSection /></>}
        {tab === "sleep" && <SleepSection />}
        {tab === "weight" && <WeightSection />}
        {tab === "food" && <FoodSection />}
      </div>
    </div>
  );
}

function StepsSection() {
  const { data, update, today, notify } = useFeit();
  const [steps, setSteps] = useState("");
  const [km, setKm] = useState("");
  const [kmTouched, setKmTouched] = useState(false);
  const todaySteps = data.steps.filter((s) => s.date === today).reduce((sum, s) => sum + s.steps, 0);
  const todayKm = data.steps.filter((s) => s.date === today).reduce((sum, s) => sum + s.km, 0);
  const runMinutes = Math.round(data.runs.filter((r) => r.date === today).reduce((sum, r) => sum + r.seconds, 0) / 60);
  const week = Array.from({ length: 7 }, (_, i) => addDays(mondayOf(today || "2026-11-16"), i)).map((d) => ({ day: fmtDate(d, { weekday: "short" }), steps: data.steps.filter((s) => s.date === d).reduce((sum, s) => sum + s.steps, 0), "Run km": Math.round(data.runs.filter((r) => r.date === d).reduce((sum, r) => sum + r.km, 0) * 10) / 10 }));
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const n = Math.round(Number(steps));
    const k = Number(km || estimateKm(n));
    if (!Number.isFinite(n) || n <= 0 || !Number.isFinite(k) || k < 0) return;
    update((c) => ({ ...c, steps: [...c.steps, { id: newId(), date: String(f.get("date") || today), steps: n, km: Math.round(k * 100) / 100 }].sort((a, b) => a.date.localeCompare(b.date)) }));
    setSteps(""); setKm(""); setKmTouched(false);
    notify("Steps saved.");
  }
  return (
    <>
      <Card className="p-5 sm:p-6">
        <CardTitle icon={Activity} title="Today's movement" hint={`Goal ${data.stepGoal.toLocaleString()} steps`} />
        <p className="text-4xl font-extrabold tabular-nums">{todaySteps.toLocaleString()}</p>
        <p className="mb-1 text-sm text-muted-foreground">{todayKm.toFixed(2)} km total{runMinutes ? ` · ${runMinutes} min running` : ""}</p>
        <ProgressBar value={todaySteps} max={data.stepGoal} />
      </Card>
      <Card className="p-5 sm:p-6">
        <CardTitle icon={Plus} title="Add steps" hint="Copy the number from your phone's health app. Km is filled in for you." />
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-3">
          <Field label="Day"><Input name="date" type="date" defaultValue={today} required /></Field>
          <Field label="Steps"><Input inputMode="numeric" type="number" min="1" step="1" placeholder="e.g. 6500" value={steps} required onChange={(e) => { setSteps(e.target.value); if (!kmTouched) setKm(e.target.value ? String(estimateKm(Number(e.target.value))) : ""); }} /></Field>
          <Field label="Distance · km" hint="Estimated from your height"><Input inputMode="decimal" type="number" min="0" step="0.01" placeholder="0.00" value={km} onChange={(e) => { setKm(e.target.value); setKmTouched(true); }} /></Field>
          <Button type="submit" className="sm:col-span-3"><Plus size={16} />Save steps</Button>
        </form>
      </Card>
      <Card className="p-5 sm:p-6">
        <CardTitle title="This week" />
        <div className="h-52"><ResponsiveContainer width="100%" height="100%"><BarChart data={week} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} /><XAxis dataKey="day" tick={tick} /><YAxis tick={tick} /><Tooltip contentStyle={tooltipStyle} /><Bar dataKey="steps" name="Steps" fill="var(--color-chart-1)" radius={[6, 6, 0, 0]} /><Bar dataKey="Run km" name="Run km" fill="var(--color-chart-2)" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div>
        <div className="mt-3 divide-y divide-border">{data.steps.slice(-8).reverse().map((s) => <LogRow key={s.id} what="steps entry" title={`${s.steps.toLocaleString()} steps`} detail={fmtDate(s.date)} right={`${s.km.toFixed(2)} km`} onDelete={() => update((c) => ({ ...c, steps: c.steps.filter((x) => x.id !== s.id) }))} />)}</div>
        {!data.steps.length && <Empty>Your movement entries will appear here.</Empty>}
      </Card>
    </>
  );
}

function SleepSection() {
  const { data, update, today, notify } = useFeit();
  const [bedDate, setBedDate] = useState(() => (today ? addDays(today, -1) : ""));
  const [bedTime, setBedTime] = useState("23:30");
  const [wakeDate, setWakeDate] = useState(today);
  const [wakeTime, setWakeTime] = useState("08:00");
  const bd = bedDate || (today ? addDays(today, -1) : "");
  const wd = wakeDate || today;
  const minutes = bd && wd ? sleepBetween(bd, bedTime, wd, wakeTime) : null;
  const chart = data.sleep.slice(-7).map((s) => ({ day: fmtDate(s.date, { weekday: "short" }), hours: Number((s.minutes / 60).toFixed(1)) }));
  function save(e: FormEvent) {
    e.preventDefault();
    if (minutes === null) return notify("Wake-up must be after bedtime (and within 24 hours).");
    update((c) => ({ ...c, sleep: [...c.sleep.filter((s) => s.date !== wd), { date: wd, bedDate: bd, bedtime: bedTime, wakeTime, minutes }].sort((a, b) => a.date.localeCompare(b.date)) }));
    notify(`Saved ${minutesLabel(minutes)} of sleep.`);
  }
  return (
    <>
      <Card className="p-5 sm:p-6">
        <CardTitle icon={BedDouble} title="Log a night of sleep" hint="Slept after midnight? Pick the same day for both — e.g. Nov 17, 2:00 AM → Nov 17, 9:00 AM." />
        <form onSubmit={save} className="grid gap-4">
          <div className="grid gap-3 rounded-xl bg-muted/60 p-3 sm:grid-cols-[auto_1fr_1fr] sm:items-end">
            <p className="flex items-center gap-2 text-sm font-bold sm:pb-2"><BedDouble size={16} className="text-primary" />I fell asleep</p>
            <Field label="Day"><Input type="date" value={bd} onChange={(e) => setBedDate(e.target.value)} required /></Field>
            <Field label="Time"><Input type="time" value={bedTime} onChange={(e) => setBedTime(e.target.value)} required /></Field>
          </div>
          <div className="grid gap-3 rounded-xl bg-muted/60 p-3 sm:grid-cols-[auto_1fr_1fr] sm:items-end">
            <p className="flex items-center gap-2 text-sm font-bold sm:pb-2"><Sunrise size={16} className="text-primary" />I woke up</p>
            <Field label="Day"><Input type="date" value={wd} onChange={(e) => setWakeDate(e.target.value)} required /></Field>
            <Field label="Time"><Input type="time" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)} required /></Field>
          </div>
          <p className={`rounded-xl px-3 py-2.5 text-sm ${minutes === null ? "bg-destructive/10 text-destructive" : "bg-secondary text-secondary-foreground"}`} aria-live="polite">
            {minutes === null ? "Wake-up must be after you fell asleep." : <>You slept from <strong>{fmtDate(bd)}, {fmtTime(bedTime)}</strong> to <strong>{fmtDate(wd)}, {fmtTime(wakeTime)}</strong> — <strong>{minutesLabel(minutes)}</strong>.</>}
          </p>
          <Button type="submit" disabled={minutes === null}><Plus size={16} />Save sleep</Button>
        </form>
      </Card>
      <Card className="p-5 sm:p-6">
        <CardTitle title="Last 7 nights" hint={`Target ${minutesLabel(SLEEP_TARGET_MINUTES)}`} />
        {chart.length ? <div className="h-52"><ResponsiveContainer width="100%" height="100%"><BarChart data={chart} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} /><XAxis dataKey="day" tick={tick} /><YAxis domain={[0, 10]} tick={tick} /><Tooltip contentStyle={tooltipStyle} /><Bar dataKey="hours" name="Hours" fill="var(--color-chart-1)" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div> : <Empty>Log a night to see your trend.</Empty>}
        <div className="mt-3 divide-y divide-border">{data.sleep.slice(-8).reverse().map((s) => <LogRow key={s.date} what="sleep record" title={minutesLabel(s.minutes)} detail={`${fmtDate(s.bedDate ?? addDays(s.date, s.bedtime > s.wakeTime ? -1 : 0))}, ${fmtTime(s.bedtime)} → ${fmtDate(s.date)}, ${fmtTime(s.wakeTime)}`} onDelete={() => update((c) => ({ ...c, sleep: c.sleep.filter((x) => x.date !== s.date) }))} />)}</div>
      </Card>
    </>
  );
}

function WeightSection() {
  const { data, update, today, notify } = useFeit();
  function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const kg = roundWeight(Number(f.get("kg")));
    const date = String(f.get("date") || today);
    if (!Number.isFinite(kg) || kg <= 0) return;
    update((c) => ({ ...c, weight: [...c.weight, { date, kg }].sort((a, b) => a.date.localeCompare(b.date)) }));
    e.currentTarget.reset();
    notify(`Weight ${kg.toFixed(2)} kg saved.`);
  }
  const latest = data.weight.at(-1);
  return (
    <>
      <Card className="p-5 sm:p-6">
        <CardTitle icon={Scale} title="Log body weight" hint="Up to two decimals, like 62.85 kg." />
        <form onSubmit={save} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <Field label="Day"><Input name="date" type="date" defaultValue={today} required /></Field>
          <Field label="Weight · kg"><Input name="kg" type="number" inputMode="decimal" min="1" step="0.01" placeholder="62.85" required /></Field>
          <Button type="submit"><Plus size={16} />Save</Button>
        </form>
        {latest && <p className="mt-4 text-sm text-muted-foreground">Latest: <strong className="text-foreground">{latest.kg.toFixed(2)} kg</strong> on {fmtDate(latest.date)}</p>}
      </Card>
      <Card className="p-5 sm:p-6">
        <CardTitle title="Weight history" />
        {data.weight.length ? <div className="h-56"><ResponsiveContainer width="100%" height="100%"><LineChart data={data.weight} margin={{ top: 4, right: 8, left: -14, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" /><XAxis dataKey="date" tick={tick} tickFormatter={(d: string) => d.slice(5)} /><YAxis domain={["auto", "auto"]} tick={tick} /><Tooltip contentStyle={tooltipStyle} /><Line type="monotone" dataKey="kg" name="kg" stroke="var(--color-chart-1)" strokeWidth={2.5} dot={{ r: 3 }} /></LineChart></ResponsiveContainer></div> : <Empty>Your weight entries will draw a line here.</Empty>}
        <div className="mt-3 divide-y divide-border">{data.weight.map((w, i) => ({ w, i })).slice(-8).reverse().map(({ w, i }) => <LogRow key={`${w.date}-${i}`} what="weight entry" title={`${w.kg.toFixed(2)} kg`} detail={fmtDate(w.date)} onDelete={() => update((c) => ({ ...c, weight: c.weight.filter((_, idx) => idx !== i) }))} />)}</div>
      </Card>
    </>
  );
}

function FoodSection() {
  const { data, update, today, notify } = useFeit();
  const meals = data.meals.filter((m) => m.date === today);
  const protein = meals.reduce((s, m) => s + m.protein, 0);
  const spent = today ? weeklySpending(data.purchases, today) : 0;
  function addMeal(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const meal = { id: newId(), date: String(f.get("date") || today), type: String(f.get("type")), food: String(f.get("food")).trim(), portion: String(f.get("portion") || "").trim(), protein: Number(f.get("protein") || 0) };
    if (!meal.food || !Number.isFinite(meal.protein) || meal.protein < 0) return;
    update((c) => ({ ...c, meals: [...c.meals, meal] }));
    e.currentTarget.reset();
    notify("Meal added.");
  }
  function addPurchase(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const p = { id: newId(), date: String(f.get("date") || today), item: String(f.get("item")).trim(), amount: Number(f.get("amount")) };
    if (!p.item || !Number.isFinite(p.amount) || !canAddPurchase(data.purchases, p.date, p.amount)) return notify(`That would go over the ₱${WEEKLY_FOOD_LIMIT} weekly limit.`);
    update((c) => ({ ...c, purchases: [...c.purchases, p] }));
    e.currentTarget.reset();
    notify("Purchase saved.");
  }
  return (
    <>
      <FoodPhotoCard />
      <Card className="p-5 sm:p-6">
        <CardTitle icon={Utensils} title="Meals today" hint="Protein is a rough guess — that's fine." action={<span className="rounded-full bg-secondary px-3 py-1 text-sm font-bold text-secondary-foreground">{protein} g</span>} />
        <form onSubmit={addMeal} className="grid gap-3 sm:grid-cols-2">
          <Field label="Meal"><select name="type" className={selectClass}><option>Breakfast</option><option>Lunch</option><option>Snack</option><option>Dinner</option></select></Field>
          <Field label="Day"><Input name="date" type="date" defaultValue={today} required /></Field>
          <Field label="What did you eat?"><Input name="food" placeholder="e.g. Rice and adobo" required /></Field>
          <Field label="How much?"><Input name="portion" placeholder="1 cup, 2 pieces…" /></Field>
          <Field label="Protein · g (guess)"><Input name="protein" type="number" min="0" step="1" placeholder="0" /></Field>
          <div className="flex items-end"><Button type="submit" className="w-full"><Plus size={16} />Add meal</Button></div>
        </form>
        <div className="mt-4 divide-y divide-border">{meals.slice().reverse().map((m) => <LogRow key={m.id} what="meal" title={m.food} detail={`${m.type}${m.portion ? ` · ${m.portion}` : ""}`} right={`~${m.protein} g`} onDelete={() => update((c) => ({ ...c, meals: c.meals.filter((x) => x.id !== m.id) }))} />)}</div>
        {!meals.length && <Empty>Meals you add today show here.</Empty>}
      </Card>
      <Card className="p-5 sm:p-6">
        <CardTitle icon={Wallet} title="Extra food spending" hint="Weekly limit · resets every Monday" />
        <div className="flex items-baseline justify-between"><p className="text-3xl font-extrabold tabular-nums">₱{spent}</p><p className="text-sm text-muted-foreground">₱{Math.max(0, WEEKLY_FOOD_LIMIT - spent)} left of ₱{WEEKLY_FOOD_LIMIT}</p></div>
        <div className="mt-2"><ProgressBar value={spent} max={WEEKLY_FOOD_LIMIT} /></div>
        <form onSubmit={addPurchase} className="mt-4 grid gap-3 sm:grid-cols-3">
          <Field label="What did you buy?"><Input name="item" placeholder="e.g. Banana cue" required /></Field>
          <Field label="Day"><Input name="date" type="date" defaultValue={today} required /></Field>
          <Field label="Amount · ₱"><Input name="amount" type="number" min="0" step="1" placeholder="0" required /></Field>
          <Button type="submit" variant="secondary" className="sm:col-span-3"><Plus size={16} />Record spending</Button>
        </form>
        <div className="mt-4 divide-y divide-border">{data.purchases.filter((p) => today && p.date >= mondayOf(today) && p.date <= today).slice().reverse().map((p) => <LogRow key={p.id} what="purchase" title={p.item} detail={fmtDate(p.date)} right={`₱${p.amount}`} onDelete={() => update((c) => ({ ...c, purchases: c.purchases.filter((x) => x.id !== p.id) }))} />)}</div>
      </Card>
    </>
  );
}
