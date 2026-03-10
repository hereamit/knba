import { AdminPageHeader } from "@/components/admin-page-header";
import { messageRows } from "@/lib/site-data";

export default function AdminMessagesPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Messages"
        description="Review incoming contact requests and member inquiries."
      />
      <section className="space-y-4">
        {messageRows.map((message) => (
          <article key={message.name} className="admin-card rounded-[1.2rem] p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-lg font-bold text-slate-800">{message.name}</p>
                <p className="text-sm text-slate-500">{message.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="admin-badge">{message.topic}</span>
                <span className="text-sm font-semibold text-slate-500">
                  {message.date}
                </span>
              </div>
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              {message.message}
            </p>
          </article>
        ))}
      </section>
    </div>
  );
}
