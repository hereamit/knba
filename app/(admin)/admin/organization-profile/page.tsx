import { AdminOrganizationProfileCard } from "@/components/admin-organization-profile-card";
import { AdminPageHeader } from "@/components/admin-page-header";

export default function AdminOrganizationProfilePage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Organization Profile"
        description="Manage the core identity, registration details, and official contact information of the association."
      />
      <AdminOrganizationProfileCard />
    </div>
  );
}
