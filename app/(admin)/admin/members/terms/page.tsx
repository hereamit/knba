import { AdminMemberManager } from "@/components/admin-member-manager";
import { AdminPageHeader } from "@/components/admin-page-header";

export default function AdminMemberTermsPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Member Terms"
        description="Use the default term form and term table on this page only."
      />
      <AdminMemberManager section="terms" />
    </div>
  );
}
