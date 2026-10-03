"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import type { Enquiry } from "@/lib/types";

type Action = "status" | "delete";

export function EnquiriesManager({ initial }: { initial: Enquiry[] }) {
  const [items, setItems] = useState(initial);
  // While a request is running, that enquiry's buttons are locked and a small spinner shows the one pressed.
  const [busy, setBusy] = useState<{ id: string; action: Action } | null>(null);
  const [error, setError] = useState("");

  async function run(id: string, action: Action, request: () => Promise<Response>) {
    if (busy) return;
    setBusy({ id, action });
    setError("");
    try {
      const response = await request();
      const data = (await response.json().catch(() => null)) as { items?: Enquiry[]; error?: string } | null;
      if (!response.ok || !data?.items) throw new Error(data?.error || "That did not save. Try again.");
      setItems(data.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "That did not save. Try again.");
    } finally {
      setBusy(null);
    }
  }

  const setStatus = (id: string, status: Enquiry["status"]) =>
    run(id, "status", () =>
      fetch(`/api/enquiries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }),
    );

  const remove = (id: string) => {
    if (busy || !confirm("Delete this enquiry?")) return;
    run(id, "delete", () => fetch(`/api/enquiries/${id}`, { method: "DELETE" }));
  };

  if (items.length === 0) {
    return <p className="rounded-3xl border border-dashed border-line bg-cream px-6 py-12 text-sm text-mist">No enquiries yet. They appear here when someone uses a form on the site.</p>;
  }

  return (
    <div>
      {error ? <p className="mb-3 text-sm text-[#c2410c]" role="alert">{error}</p> : null}
      <ul className="space-y-3">
        {items.map((item) => {
          const working = busy?.id === item.id;
          return (
            <li key={item.id} className={`rounded-3xl border border-line bg-cream p-5 transition-opacity ${working && busy?.action === "delete" ? "opacity-60" : ""}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-mist">{item.email}{item.phone ? ` · ${item.phone}` : ""}</p>
                </div>
                <span className="rounded-full bg-sand px-3 py-1 text-xs uppercase tracking-[0.14em]">{item.status}</span>
              </div>
              <p className="mt-3 text-sm text-pine">{item.tripTitle || "General enquiry"}{item.departure ? ` · ${item.departure}` : ""}</p>
              <p className="mt-2 text-sm leading-6">{item.message}</p>
              <p className="mt-2 text-xs text-mist">{new Date(item.createdAt).toLocaleString("en-IN")}</p>
              <div className="mt-4 flex items-center gap-3 text-sm">
                <button
                  type="button"
                  disabled={working}
                  aria-busy={working && busy?.action === "status"}
                  className="inline-flex min-h-9 items-center gap-1.5 text-pine disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={() => setStatus(item.id, item.status === "new" ? "contacted" : "new")}
                >
                  {item.status === "new" ? "Mark contacted" : "Mark new"}
                  {working && busy?.action === "status" ? <Loader2 aria-hidden className="size-3.5 animate-spin" /> : null}
                </button>
                <button
                  type="button"
                  disabled={working}
                  aria-busy={working && busy?.action === "delete"}
                  className="inline-flex min-h-9 items-center gap-1.5 text-[#f94f18] disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={() => remove(item.id)}
                >
                  Delete
                  {working && busy?.action === "delete" ? <Loader2 aria-hidden className="size-3.5 animate-spin" /> : null}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
