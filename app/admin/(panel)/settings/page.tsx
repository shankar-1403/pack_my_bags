import { SettingsForm } from "@/components/admin/settings-form";
import { getSettings } from "@/lib/content";

export default async function SettingsPage() {
  return (
    <div>
      <h1 className="font-serif text-5xl tracking-tight">Settings</h1>
      <p className="mt-2 mb-8 text-sm text-mist">Phone, promo bar, and the address in the footer.</p>
      <SettingsForm initial={(await getSettings())} />
    </div>
  );
}
