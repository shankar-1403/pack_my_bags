import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/nav";
import { isAuthed } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAuthed())) redirect("/admin/login");

  return (
    <div className="min-h-screen bg-paper md:grid md:grid-cols-[240px_minmax(0,1fr)]">
      <AdminNav />
      <div className="min-w-0 px-4 py-6 md:px-8 md:py-8">{children}</div>
    </div>
  );
}
