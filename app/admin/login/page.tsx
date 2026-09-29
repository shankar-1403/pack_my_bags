import { Logo } from "@/components/logo";
import { LoginForm } from "@/components/admin/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-5">
      <div className="w-full max-w-md rounded-[32px] border border-line bg-cream p-8">
        <Logo />
        <h1 className="mt-6 font-serif text-4xl tracking-tight">Studio login</h1>
        <p className="mt-2 text-sm leading-6 text-ink/70">The CMS edits trips, stories, reviews, and the public contact details.</p>
        <LoginForm nextPath={params.from || "/admin"} showHint={process.env.NODE_ENV !== "production"} />
      </div>
    </div>
  );
}
