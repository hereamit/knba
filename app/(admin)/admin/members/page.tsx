import Link from "next/link";
import { AdminPageHeader } from "@/components/admin-page-header";

export default function AdminMembersPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Members"
        description="Manage committee terms and member records from the buttons below."
      />

      <div className="flex flex-wrap gap-3">
        <Link href="/admin/members/terms" className="admin-master-btn admin-master-btn-primary">
          + Term
        </Link>
        <Link href="/admin/members/members" className="admin-master-btn admin-master-btn-primary">
          + Member
        </Link>
        <Link
          href="/admin/members/general-members"
          className="admin-master-btn admin-master-btn-primary"
        >
          + General Member
        </Link>
        <Link
          href="/admin/messages/members"
          className="admin-master-btn admin-master-btn-secondary"
        >
          Member Submissions →
        </Link>
      </div>
    </div>
  );
}
