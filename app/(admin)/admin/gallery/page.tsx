import Image from "next/image";
import { AdminPageHeader } from "@/components/admin-page-header";
import { galleryItems } from "@/lib/site-data";

export default function AdminGalleryPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Gallery Manager"
        description="Organize media by category and keep featured activity photos ready for publishing."
      />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {galleryItems.map((item) => (
          <article
            key={item.title}
            className="admin-card overflow-hidden rounded-[1.2rem]"
          >
            <div className="relative h-56">
              <Image src={item.src} alt={item.title} fill className="object-cover" />
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-slate-800">{item.title}</h2>
                <span className="admin-badge">{item.category}</span>
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-500">
                {item.description}
              </p>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
