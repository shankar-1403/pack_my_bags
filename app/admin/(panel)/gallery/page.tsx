import { GalleryManager } from "@/components/admin/gallery-manager";
import { getGallery } from "@/lib/content";

export default async function AdminGalleryPage() {
  const items = await getGallery();

  return (
    <div>
      <h1 className="font-serif text-5xl tracking-tight">Gallery</h1>
      <p className="mt-2 max-w-2xl text-sm text-mist">
        The prints on the Gallery page, in this order. Each needs a place name — it is written on the print by hand. Up to 22 show on desktop and 12 on phones.
      </p>
      <GalleryManager initial={items} />
    </div>
  );
}
