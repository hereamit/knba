import { AdminPageHeader } from "@/components/admin-page-header";
import { memberRows } from "@/lib/site-data";

export default function AdminMembersPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Members"
        description="Track membership records, renewal progress, and sector coverage."
      />
      <section className="admin-card rounded-[1.2rem] p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              Directory
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-800">
              Member status overview
            </h2>
          </div>
          <span className="admin-badge">325 active records</span>
        </div>
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-3">
            <thead>
              <tr className="text-left text-sm font-semibold text-slate-500">
                <th className="pb-2">Business</th>
                <th className="pb-2">Category</th>
                <th className="pb-2">Renewal</th>
                <th className="pb-2">Contact</th>
              </tr>
            </thead>
            <tbody>
              {memberRows.map((item) => (
                <tr key={item.business}>
                  <td className="rounded-l-[0.9rem] bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-800">
                    {item.business}
                  </td>
                  <td className="bg-slate-50 px-4 py-4 text-sm text-slate-600">
                    {item.category}
                  </td>
                  <td className="bg-slate-50 px-4 py-4 text-sm text-slate-600">
                    {item.renewal}
                  </td>
                  <td className="rounded-r-[0.9rem] bg-slate-50 px-4 py-4 text-sm text-slate-600">
                    {item.contact}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
