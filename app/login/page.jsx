"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createBrowserAuthClient } from "@/lib/supabase/browser";

// Only follow redirects that stay on this site.
function safeNext() {
  const next = new URLSearchParams(window.location.search).get("next") || "/platform/home";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/platform/home";
}

export default function LoginPage() {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    setNotice(null);

    const supabase = createBrowserAuthClient();
    try {
      if (mode === "signup") {
        if (password.length < 8) throw new Error("Use a password of at least 8 characters.");
        const { data, error: err } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        });
        if (err) throw err;
        if (!data.session) {
          setNotice("Account created. Check your email and click the link to confirm, then sign in.");
          setMode("signin");
          setPassword("");
          return;
        }
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (err) throw err;
      }
      // Full page load so the server sees the new session cookies.
      window.location.assign(safeNext());
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-5">
      <h1 className="font-brand text-3xl text-foreground">Doc-Vision-1</h1>
      <p className="mt-1 text-sm text-muted-foreground">{mode === "signin" ? "Sign in" : "Create an account"}</p>

      <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            autoFocus
            className="mt-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            required
            className="mt-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {notice && <p className="text-sm text-foreground">{notice}</p>}

        <Button type="submit" size="lg" disabled={busy}>
          {busy && <Loader2 className="animate-spin" />}
          {mode === "signin" ? "Sign in" : "Create account"}
        </Button>
      </form>

      <button
        type="button"
        onClick={() => {
          setMode(mode === "signin" ? "signup" : "signin");
          setError(null);
          setNotice(null);
        }}
        className="mt-4 self-start text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
      >
        {mode === "signin" ? "Create an account" : "I already have an account"}
      </button>
    </main>
  );
}
