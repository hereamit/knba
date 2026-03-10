import { AdminPageHeader } from "@/components/admin-page-header";
import { eventRows } from "@/lib/site-data";

export default function AdminEventsPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Events"
        description="Plan community events, training programs, and market coordination sessions."
      />
      <section className="grid gap-4 lg:grid-cols-3">
        {eventRows.map((event) => (
          <article key={event.title} className="admin-card rounded-[1.2rem] p-6">
            <span className="admin-badge">{event.date}</span>
            <h2 className="mt-4 text-2xl font-bold text-slate-800">
              {event.title}
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-500">
              {event.description}
            </p>
            <div className="mt-6 flex items-center justify-between gap-3 text-sm text-slate-600">
              <span>{event.venue}</span>
              <span className="font-semibold text-primary">{event.status}</span>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
