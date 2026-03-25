import { AdminGeneralMemberManager } from "@/components/admin-general-member-manager";
import { AdminPageHeader } from "@/components/admin-page-header";

export default function AdminGeneralMembersPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="General Members"
        description="Use the default general member form and general member table on this page only."
      />
      <AdminGeneralMemberManager />
    </div>
  );
}
