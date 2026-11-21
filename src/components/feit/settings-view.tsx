import { useEffect, useRef, useState, type ChangeEvent, type MouseEvent } from "react";
import { flushSync } from "react-dom";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowDownToLine, ArrowUpFromLine, Bell, BellOff, Footprints, Laptop, Loader2, LogOut, Moon, Palette, Sun, Trash2, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardTitle, PageHeader } from "@/components/feit/ui";
import { supabase } from "@/integrations/supabase/client";
import { createEmptyData, isFitTrackData } from "@/lib/fittrack-data";
import { useFeit, type ThemeChoice } from "@/lib/feit-store";
import { getPushPublicKey, removePushSubscription, savePushSubscription, sendTestPush } from "@/lib/push.functions";
import { currentSubscription, disablePush, enablePush, pushSupport, type PushSupport } from "@/lib/push-client";

export function SettingsView() {
  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Make it yours" title="Settings" />
      <div className="feit-stagger space-y-5">
        <Appearance />
        <Reminders />
        <Account />
        <Goals />
        <Backup />
      </div>
    </div>
  );
}

function Appearance() {
  const { theme, setTheme } = useFeit();
  function pick(next: ThemeChoice, e: MouseEvent<HTMLButtonElement>) {
    const doc = document as Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void> } };
    if (!doc.startViewTransition || window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setTheme(next); return; }
    const x = e.clientX || window.innerWidth / 2, y = e.clientY || window.innerHeight / 2;
    const r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    const t = doc.startViewTransition(() => flushSync(() => setTheme(next)));
    t.ready.then(() => document.documentElement.animate({ clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] }, { duration: 600, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)", pseudoElement: "::view-transition-new(root)" })).catch(() => undefined);
  }
  const options: { value: ThemeChoice; label: string; icon: typeof Sun }[] = [{ value: "light", label: "Light", icon: Sun }, { value: "dark", label: "Dark", icon: Moon }, { value: "device", label: "Same as device", icon: Laptop }];
  return (
    <Card className="p-5 sm:p-6">
      <CardTitle icon={Palette} title="Theme" hint="Choose how Feit looks." />
      <div className="grid grid-cols-3 gap-2">{options.map(({ value, label, icon: Icon }) => <button key={value} type="button" aria-pressed={theme === value} onClick={(e) => pick(value, e)} className={`flex flex-col items-center gap-1.5 rounded-xl border py-3 text-xs font-semibold transition-all active:scale-95 sm:text-sm ${theme === value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-muted"}`}><Icon size={20} />{label}</button>)}</div>
    </Card>
  );
}

function Reminders() {
  const { data, update, session, authReady, notify } = useFeit();
  const getKey = useServerFn(getPushPublicKey);
  const save = useServerFn(savePushSubscription);
  const remove = useServerFn(removePushSubscription);
  const test = useServerFn(sendTestPush);
  const [support, setSupport] = useState<PushSupport>("ok");
  const [deviceOn, setDeviceOn] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => { setSupport(pushSupport()); currentSubscription().then((s) => setDeviceOn(!!s)).catch(() => undefined); }, []);

  async function turnOn() {
    setBusy(true);
    try {
      await enablePush({ getKey, save });
      update((c) => ({ ...c, remindersOn: true }));
      setDeviceOn(true);
      const r = await test();
      notify(r.sent ? "Reminders are on — check for a test notification." : "Reminders are on.");
    } catch (e) {
      notify(e instanceof Error && e.message === "permission" ? "Notifications were blocked. Allow them in your browser settings, then try again." : "Couldn't turn on reminders. Please try again.");
      setSupport(pushSupport());
    }
    setBusy(false);
  }
  async function turnOff() {
    setBusy(true);
    await disablePush(remove).catch(() => undefined);
    update((c) => ({ ...c, remindersOn: false }));
    setDeviceOn(false);
    setBusy(false);
    notify("Reminders turned off on this device.");
  }

  const message: Record<Exclude<PushSupport, "ok">, string> = {
    "in-preview-frame": "Open Feit in its own tab or the installed app to turn on reminders.",
    "ios-needs-install": "On iPhone, first add Feit to your Home Screen (Share → Add to Home Screen), then open it from there and turn on reminders.",
    unsupported: "This browser can't show reminders. Try Chrome, Edge, Firefox or Safari.",
    denied: "Notifications are blocked for Feit. Allow them in your browser or phone settings, then come back.",
  };
  const on = data.remindersOn && deviceOn;
  return (
    <Card className="p-5 sm:p-6">
      <CardTitle icon={Bell} title="Routine reminders" hint="Get a notification when each step of your daily routine starts — even when Feit is closed." />
      {!authReady ? null : !session ? (
        <div className="rounded-xl bg-muted/60 p-4 text-sm"><p>Sign in first so reminders can reach this device.</p><Button asChild size="sm" className="mt-3"><Link to="/auth">Sign in</Link></Button></div>
      ) : support !== "ok" ? (
        <p className="rounded-xl bg-accent/40 p-4 text-sm">{message[support]}</p>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm"><strong>{on ? "On" : "Off"}</strong> on this device{on ? " · times come from your daily routine" : ""}</p>
          {on
            ? <div className="flex gap-2"><Button variant="outline" size="sm" disabled={busy} onClick={async () => { const r = await test().catch(() => ({ sent: 0 })); notify(r.sent ? "Test sent." : "No device received it — try turning reminders off and on."); }}>Send test</Button><Button variant="ghost" size="sm" disabled={busy} onClick={turnOff}><BellOff size={15} />Turn off</Button></div>
            : <Button disabled={busy} onClick={turnOn}>{busy ? <Loader2 className="animate-spin" /> : <Bell size={16} />}Turn on reminders</Button>}
        </div>
      )}
      <p className="mt-3 text-xs text-muted-foreground">Reminders are checked every 15 minutes, so routine times use quarter hours (like 9:00, 11:15, 11:30). Edit times on the <Link to="/habits" className="font-semibold text-primary">Routine</Link> page.</p>
    </Card>
  );
}

function Account() {
  const { session, authReady, notify, sync } = useFeit();
  const syncText = { off: "", syncing: "Saving your logs to your account…", synced: "Your logs are saved to your account and show on every device you sign in on.", error: "Couldn't reach your account — logs are safe on this device and will save when you're back online." }[sync];
  return (
    <Card className="p-5 sm:p-6">
      <CardTitle icon={UserRound} title="Account" hint="Sign in to save your logs to your account and use the AI coach, lessons and reminders." />
      {!authReady ? null : session ? (
        <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm">Signed in as <strong>{session.user.email}</strong></p><Button variant="outline" size="sm" onClick={async () => { await supabase.auth.signOut(); notify("Signed out."); }}><LogOut size={15} />Sign out</Button>{syncText && <p className="w-full text-xs text-muted-foreground">{syncText}</p>}</div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-muted-foreground">Not signed in on this device. The installed app has its own sign-in, separate from your browser.</p><Button asChild size="sm"><Link to="/auth">Sign in</Link></Button></div>
      )}
    </Card>
  );
}

function Goals() {
  const { data, update, notify } = useFeit();
  const [goal, setGoal] = useState(String(data.stepGoal));
  useEffect(() => setGoal(String(data.stepGoal)), [data.stepGoal]);
  return (
    <Card className="p-5 sm:p-6">
      <CardTitle icon={Footprints} title="Daily step goal" />
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); const n = Math.round(Number(goal)); if (n > 0) { update((c) => ({ ...c, stepGoal: n })); notify("Step goal saved."); } }}>
        <Input type="number" min="500" step="500" value={goal} onChange={(e) => setGoal(e.target.value)} aria-label="Daily step goal" />
        <Button type="submit">Save</Button>
      </form>
    </Card>
  );
}

function Backup() {
  const { data, replace, today, notify } = useFeit();
  const input = useRef<HTMLInputElement>(null);
  function exportData() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    const a = document.createElement("a"); a.href = url; a.download = `feit-backup-${today || "data"}.json`; a.click(); URL.revokeObjectURL(url);
    notify("Your backup is downloading.");
  }
  async function importData(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    try { const parsed: unknown = JSON.parse(await file.text()); if (!isFitTrackData(parsed)) throw new Error(); replace(parsed); notify("Backup restored."); } catch { notify("That file isn't a Feit backup."); }
    e.target.value = "";
  }
  return (
    <Card className="p-5 sm:p-6">
      <CardTitle icon={ArrowDownToLine} title="Backup" hint="Your logs are saved automatically in this browser. Download a copy to move devices." />
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={exportData}><ArrowDownToLine size={16} />Download backup</Button>
        <Button variant="outline" onClick={() => input.current?.click()}><ArrowUpFromLine size={16} />Restore backup</Button>
        <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={() => { if (window.confirm("Clear all Feit records saved on this device? This can't be undone.")) { replace(createEmptyData()); notify("All records cleared."); } }}><Trash2 size={16} />Clear everything</Button>
        <input ref={input} type="file" accept="application/json,.json" className="hidden" onChange={importData} />
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Restoring replaces what's on this device. Workout photos aren't included in backups.</p>
    </Card>
  );
}
