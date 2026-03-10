import type { ReactNode } from "react";
import { GoogleTranslateToggle } from "@/components/google-translate-toggle";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="page-shell min-h-screen">
      <SiteHeader />
      <GoogleTranslateToggle />
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}
