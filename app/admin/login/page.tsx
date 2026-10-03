import Image from "next/image";
import { LoginForm } from "@/components/admin/login-form";
import Logo from "../../../public/logo.webp";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-5 py-10">
      <div className="w-full max-w-md rounded-[32px] border border-line bg-cream p-8 sm:p-10">
        <Image src={Logo} alt="PackMyBags" priority className="h-12 w-auto" />
        <h1 className="mt-8 font-serif text-4xl tracking-tight">CMS login</h1>
        <p className="mt-2 text-sm leading-6 text-ink/70">Edit destinations, stories, reviews, and the public contact details.</p>
        <LoginForm nextPath={params.from || "/admin"} />
      </div>
    </div>
  );
}
