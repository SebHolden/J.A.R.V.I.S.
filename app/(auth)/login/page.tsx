"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { login } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export default function LoginPage() {
  const [email, setEmail] = useState("chiara@publitrust.it");
  const [password, setPassword] = useState("demo1234");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await login(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="stripe-gradient-bg relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="stripe-orb stripe-orb-1 opacity-70" />
        <div className="stripe-orb stripe-orb-2 opacity-60" />
        <div className="stripe-orb stripe-orb-3 opacity-50" />
      </div>

      <div className="absolute right-6 top-6 z-20 animate-fade-in-up">
        <ThemeToggle />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 flex animate-fade-in-up flex-col items-center text-center">
          <div className="stripe-logo-glow mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground transition-transform duration-500 hover:scale-110">
            <Sparkles className="h-7 w-7" />
          </div>
          <h1 className="stripe-heading stripe-gradient-text text-3xl">AgencyPilot</h1>
          <p className="mt-2 text-sm text-muted-foreground animation-delay-200 animate-fade-in-up">
            AI Account Manager for marketing agencies
          </p>
        </div>

        <Card className="stripe-card animate-fade-in-up border-0 ring-0 animation-delay-200">
          <CardHeader className="pb-2 text-center">
            <CardTitle className="text-lg font-semibold">Sign in</CardTitle>
            <CardDescription>Welcome back to Publitrust</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 bg-background transition-shadow focus-visible:shadow-[var(--stripe-shadow)]"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-10 bg-background transition-shadow focus-visible:shadow-[var(--stripe-shadow)]"
                  required
                />
              </div>
              {error && (
                <p className="animate-fade-in-up rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}
              <Button type="submit" className="h-10 w-full transition-transform active:scale-[0.98]" disabled={loading}>
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </form>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Demo: chiara@publitrust.it / demo1234
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
