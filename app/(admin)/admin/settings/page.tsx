import { AdminPageHeader } from "@/components/admin-page-header";
import { MemberSubmissionsToggle } from "@/components/member-submissions-toggle";
import { settingsCards } from "@/lib/site-data";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Settings"
        description="Manage portal configuration, content workflow, and organization contact details."
      />
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <MemberSubmissionsToggle />
        {settingsCards.map((item) => (
          <article key={item.title} className="admin-card rounded-[1rem] p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-bold text-slate-800">{item.title}</h2>
              <span className="admin-badge">{item.status}</span>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
