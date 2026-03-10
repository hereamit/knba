import { GalleryShowcase } from "@/components/gallery-showcase";
import { SectionHeading } from "@/components/section-heading";
import { galleryItems, gallerySummary } from "@/lib/site-data";

export default function GalleryPage() {
  return (
    <div className="section-wrap py-8 md:py-12">
      <section className="overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#273c75,#1e3799)] px-6 py-12 text-white md:px-10">
        <SectionHeading
          eyebrow="Gallery"
          title="Interactive moments from the association’s work and events."
          description="Browse highlights from business meetings, market management, festivals, orientation programs, and member collaboration sessions. Use the category filters and click any image to open it in a larger lightbox view."
          light
        />
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {gallerySummary.map((item) => (
            <div key={item.label} className="rounded-[1.4rem] bg-white/10 p-5">
              <p className="text-3xl font-bold">{item.value}</p>
              <p className="mt-2 text-sm font-semibold uppercase tracking-[0.24em] text-white/68">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-20">
        <GalleryShowcase items={galleryItems} />
      </section>
    </div>
  );
}
