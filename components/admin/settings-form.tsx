"use client";

import { useState } from "react";
import type { SiteSettings } from "@/lib/types";
import { Field, inputClass } from "./fields";

export function SettingsForm({ initial }: { initial: SiteSettings }) {
  const [settings, setSettings] = useState(initial);
  const [status, setStatus] = useState("");

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("");
    const response = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setStatus(response.ok ? "Saved. The public site will pick this up on the next load." : "Could not save settings.");
  }

  const fields: { key: keyof SiteSettings; label: string }[] = [
    { key: "name", label: "Site name" },
    { key: "tagline", label: "Tagline" },
    { key: "promo", label: "Promo bar" },
    { key: "phone", label: "Phone" },
    { key: "whatsapp", label: "WhatsApp number, country code, no plus" },
    { key: "email", label: "Email" },
    { key: "address", label: "Address" },
  ];

  return (
    <form onSubmit={onSubmit} className="grid max-w-2xl gap-4">
      {fields.map((field) => (
        <Field key={field.key} label={field.label}>
          {field.key === "address" || field.key === "tagline" ? (
            <textarea className={inputClass} rows={3} value={settings[field.key]} onChange={(event) => setSettings({ ...settings, [field.key]: event.target.value })} />
          ) : (
            <input className={inputClass} value={settings[field.key]} onChange={(event) => setSettings({ ...settings, [field.key]: event.target.value })} />
          )}
        </Field>
      ))}
      {status ? <p className="text-sm text-pine">{status}</p> : null}
      <button type="submit" className="w-fit rounded-full bg-ink px-5 py-3 text-sm text-cream">Save settings</button>
    </form>
  );
}
