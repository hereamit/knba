import Link from "next/link";
import { AdminPageHeader } from "@/components/admin-page-header";

export default function AdminMembersPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Members"
        description="Manage committee terms and member records from separate admin pages."
      />

      <section className="grid gap-6 md:grid-cols-3">
        <article className="admin-card rounded-[1.2rem] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-primary">
            + Term
          </p>
          <h2 className="mt-3 text-2xl font-bold text-slate-800">Manage Terms</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Create committee terms, set the current term, and manage the term table separately.
          </p>
          <div className="mt-5">
            <Link href="/admin/members/terms" className="admin-master-btn admin-master-btn-primary">
              Open Terms Page
            </Link>
          </div>
        </article>

        <article className="admin-card rounded-[1.2rem] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-primary">
            + Member
          </p>
          <h2 className="mt-3 text-2xl font-bold text-slate-800">Manage Members</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Add and update member records using the default member form and member table only.
          </p>
          <div className="mt-5">
            <Link href="/admin/members/members" className="admin-master-btn admin-master-btn-primary">
              Open Members Page
            </Link>
          </div>
        </article>

        <article className="admin-card rounded-[1.2rem] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-primary">
            + General Member
          </p>
          <h2 className="mt-3 text-2xl font-bold text-slate-800">Manage General Members</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Keep internal member business records here without displaying them on the public website.
          </p>
          <div className="mt-5">
            <Link href="/admin/members/general-members" className="admin-master-btn admin-master-btn-primary">
              Open General Members Page
            </Link>
          </div>
        </article>
      </section>
    </div>
  );
}
