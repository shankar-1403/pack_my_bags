"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { sendPasswordResetEmail, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { clientAuth } from "@/lib/firebase-client";

const field = "w-full rounded-2xl border border-line bg-paper px-4 py-3 text-sm outline-none focus:border-clay";

function message(code: string) {
  if (code.includes("invalid-credential") || code.includes("wrong-password") || code.includes("user-not-found")) return "Email or password is wrong.";
  if (code.includes("invalid-email")) return "Enter a valid email address.";
  if (code.includes("too-many-requests")) return "Too many tries. Wait a minute and try again.";
  if (code.includes("network")) return "No connection. Check your internet and try again.";
  if (code.includes("api-key") || code.includes("suspended")) return "Sign-in is switched off: the Firebase key needs fixing (see FIREBASE.md).";
  if (code.includes("operation-not-allowed") || code.includes("configuration-not-found")) return "Email sign-in is not switched on in Firebase yet.";
  return "Could not sign in. Try again.";
}

export function LoginForm({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);
  const [show, setShow] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    setNote("");
    const password = String(new FormData(event.currentTarget).get("password") ?? "");
    const auth = clientAuth();
    try {
      const { user } = await signInWithEmailAndPassword(auth, email.trim(), password);
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: await user.getIdToken() }),
      });
      // The CMS keeps its own session; the browser does not need to stay signed in to Firebase.
      await signOut(auth);
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error || "Could not sign in. Try again.");
        setPending(false);
        return;
      }
      router.push(nextPath.startsWith("/admin") ? nextPath : "/admin");
      router.refresh();
    } catch (err) {
      setError(message(String((err as { code?: string })?.code ?? err)));
      setPending(false);
    }
  }

  async function onReset() {
    setError("");
    setNote("");
    if (!email.trim()) return setError("Type your email above first, then tap “Forgot password”.");
    try {
      await sendPasswordResetEmail(clientAuth(), email.trim());
    } catch {
      // Same reply either way, so the form never reveals which emails have accounts.
    }
    setNote("If that email has an account, a reset link is on its way.");
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-xs uppercase tracking-[0.16em] text-mist">Email</span>
        <input name="email" type="email" required autoFocus autoComplete="username" spellCheck={false} value={email} onChange={(e) => setEmail(e.target.value)} className={field} />
      </label>
      <label className="block">
        <span className="mb-1.5 flex items-center justify-between text-xs uppercase tracking-[0.16em] text-mist">
          Password
          <button type="button" onClick={onReset} className="normal-case tracking-normal text-pine hover:underline">Forgot password?</button>
        </span>
        <span className="relative block">
          <input name="password" type={show ? "text" : "password"} required autoComplete="current-password" className={`${field} pr-12`} />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? "Hide password" : "Show password"}
            aria-pressed={show}
            className="absolute inset-y-0 right-1 grid w-11 place-items-center rounded-full text-mist hover:text-ink"
          >
            {show ? <EyeOff className="size-5" strokeWidth={1.6} /> : <Eye className="size-5" strokeWidth={1.6} />}
          </button>
        </span>
      </label>
      {error ? <p className="text-sm text-[#f94f18]" role="alert">{error}</p> : null}
      {note ? <p className="text-sm text-pine" aria-live="polite">{note}</p> : null}
      <button type="submit" disabled={pending} className="min-h-12 w-full rounded-full bg-ink text-sm text-cream disabled:opacity-60">
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
