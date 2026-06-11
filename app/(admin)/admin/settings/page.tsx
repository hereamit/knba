import { AdminPageHeader } from "@/components/admin-page-header";
import { settingsCards } from "@/lib/site-data";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Settings"
        description="Manage portal configuration, content workflow, and organization contact details."
      />
      <section className="grid gap-4 lg:grid-cols-2">
        {settingsCards.map((item) => (
          <article key={item.title} className="admin-card rounded-[1.2rem] p-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-bold text-slate-800">{item.title}</h2>
              <span className="admin-badge">{item.status}</span>
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-500">
              {item.description}
            </p>
          </article>
        ))}
      </section>
    </div>
  );
}
