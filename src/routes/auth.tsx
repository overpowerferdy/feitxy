import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { signInWithGoogle } from "@/lib/lovable-auth";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — Feit" }, { name: "description", content: "Sign in to get AI reviews of your Feit logs." }, { property: "og:title", content: "Sign in — Feit" }, { property: "og:description", content: "Sign in to get AI reviews of your Feit logs." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email")), password = String(f.get("password"));
    setBusy(true); setMsg("");
    const { data, error } = mode === "in" ? await supabase.auth.signInWithPassword({ email, password }) : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
    setBusy(false);
    if (error) return setMsg(error.message);
    if (data.session) navigate({ to: "/workouts" }); else setMsg("Check your email to confirm your account, then sign in.");
  }
  async function google() {
    const r = await signInWithGoogle();
    if ("error" in r && r.error) setMsg(r.error.message);
    else if (!("redirected" in r && r.redirected)) navigate({ to: "/workouts" });
  }
  return <div className="flex min-h-screen items-center justify-center bg-background px-4"><div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-sm">
    <div className="mb-6 flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Activity size={20} /></span><div><h1 className="text-xl font-bold">{mode === "in" ? "Welcome back" : "Create account"}</h1><p className="text-sm text-muted-foreground">Needed for your AI coach reviews</p></div></div>
    <Button variant="outline" className="w-full" onClick={google}>Continue with Google</Button>
    <div className="my-4 text-center text-xs text-muted-foreground">or</div>
    <form onSubmit={submit} className="grid gap-3"><Input name="email" type="email" placeholder="Email" required /><Input name="password" type="password" placeholder="Password" minLength={6} required /><Button disabled={busy}>{mode === "in" ? "Sign in" : "Sign up"}</Button></form>
    {msg && <p className="mt-3 text-sm text-muted-foreground">{msg}</p>}
    <button className="mt-4 text-sm text-primary" onClick={() => setMode(mode === "in" ? "up" : "in")}>{mode === "in" ? "No account? Sign up" : "Have an account? Sign in"}</button>
  </div></div>;
}
