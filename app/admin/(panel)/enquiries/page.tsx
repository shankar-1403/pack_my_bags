import { EnquiriesManager } from "@/components/admin/enquiries-manager";
import { getEnquiries } from "@/lib/content";

export default function EnquiriesPage() {
  return (
    <div>
      <h1 className="font-serif text-5xl tracking-tight">Enquiries</h1>
      <p className="mt-2 mb-8 text-sm text-mist">Messages from the contact page and trip booking cards.</p>
      <EnquiriesManager initial={getEnquiries()} />
    </div>
  );
}
