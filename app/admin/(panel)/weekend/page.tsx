import { WeekendManager } from "@/components/admin/weekend-manager";
import { getWeekend } from "@/lib/content";

export default async function AdminWeekendPage() {
  const items = await getWeekend();

  return (
    <div>
      <h1 className="font-serif text-5xl tracking-tight">Weekend banners</h1>
      <p className="mt-2 max-w-2xl text-sm text-mist">
        The wide sliding banner on the home page. Use landscape photos (wider than tall, at least 2000 px wide works best). Title, line and link are optional.
      </p>
      <WeekendManager initial={items} />
    </div>
  );
}
