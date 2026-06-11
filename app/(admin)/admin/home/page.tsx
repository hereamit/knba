import { AdminHomeHeroManager } from "@/components/admin-home-hero-manager";
import { AdminHomeManager } from "@/components/admin-home-manager";

export default function AdminHomePage() {
  return (
    <div className="space-y-8">
      <AdminHomeHeroManager />
      <AdminHomeManager />
    </div>
  );
}
