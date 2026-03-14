import { AdminMemberManager } from "@/components/admin-member-manager";
import { AdminPageHeader } from "@/components/admin-page-header";

export default function AdminMembersListPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Members"
        description="Use the default member form and member table on this page only."
      />
      <AdminMemberManager section="members" />
    </div>
  );
}
