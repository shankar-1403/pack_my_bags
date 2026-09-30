"use client";

import { useState } from "react";
import type { Enquiry } from "@/lib/types";

export function EnquiriesManager({ initial }: { initial: Enquiry[] }) {
  const [items, setItems] = useState(initial);

  async function setStatus(id: string, status: Enquiry["status"]) {
    const response = await fetch(`/api/enquiries/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = (await response.json()) as { items: Enquiry[] };
    setItems(data.items);
  }

  async function remove(id: string) {
    if (!confirm("Delete this enquiry?")) return;
    const response = await fetch(`/api/enquiries/${id}`, { method: "DELETE" });
    const data = (await response.json()) as { items: Enquiry[] };
    setItems(data.items);
  }

  if (items.length === 0) {
    return <p className="rounded-3xl border border-dashed border-line bg-cream px-6 py-12 text-sm text-mist">No enquiries yet. They appear here when someone uses a form on the site.</p>;
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.id} className="rounded-3xl border border-line bg-cream p-5">
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
          <div className="mt-4 flex gap-3 text-sm">
            {item.status === "new" ? (
              <button type="button" className="text-pine" onClick={() => setStatus(item.id, "contacted")}>Mark contacted</button>
            ) : (
              <button type="button" className="text-pine" onClick={() => setStatus(item.id, "new")}>Mark new</button>
            )}
            <button type="button" className="text-[#f94f18]" onClick={() => remove(item.id)}>Delete</button>
          </div>
        </li>
      ))}
    </ul>
  );
}
