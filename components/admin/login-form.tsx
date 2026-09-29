"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm({ nextPath, showHint }: { nextPath: string; showHint: boolean }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const password = String(new FormData(event.currentTarget).get("password") ?? "");
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setPending(false);
    if (!response.ok) {
      setError("That password did not match.");
      return;
    }
    router.push(nextPath.startsWith("/admin") ? nextPath : "/admin");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-xs uppercase tracking-[0.16em] text-mist">Password</span>
        <input name="password" type="password" required autoFocus className="w-full rounded-2xl border border-line bg-paper px-4 py-3 text-sm outline-none focus:border-clay" />
      </label>
      {error ? <p className="text-sm text-clay">{error}</p> : null}
      <button type="submit" disabled={pending} className="w-full rounded-full bg-ink py-3 text-sm text-cream disabled:opacity-60">
        {pending ? "Checking…" : "Enter the studio"}
      </button>
      {showHint ? <p className="text-center text-xs text-mist">Local password is tripsody unless CMS_PASSWORD is set.</p> : null}
    </form>
  );
}
