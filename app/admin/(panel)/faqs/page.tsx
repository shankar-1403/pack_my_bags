import { FaqsManager } from "@/components/admin/faqs-manager";
import { getFaqs } from "@/lib/content";

export default function FaqsPage() {
  return (
    <div>
      <h1 className="font-serif text-5xl tracking-tight">FAQs</h1>
      <p className="mt-2 mb-8 text-sm text-mist">Shown on the homepage, in the order you save them.</p>
      <FaqsManager initial={getFaqs()} />
    </div>
  );
}
