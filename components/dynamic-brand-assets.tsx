"use client";

import { useEffect } from "react";
import { useOrganizationProfile } from "@/components/organization-profile-provider";
import { resolveOrganizationImageSrc } from "@/lib/organization-profile";

export function DynamicBrandAssets() {
  const { profile } = useOrganizationProfile();

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const faviconSource = profile.logo_url || (typeof profile.logo === "string" ? profile.logo : "");
    const faviconBaseHref = faviconSource
      ? resolveOrganizationImageSrc(faviconSource)
      : "/favicon.ico";
    const version = profile.updated_at
      ? encodeURIComponent(profile.updated_at)
      : "current";
    const faviconHref = `${faviconBaseHref}${faviconBaseHref.includes("?") ? "&" : "?"}v=${version}`;

    const definitions = [
      {
        selector: "link[data-knba-dynamic-icon='icon']",
        rel: "icon",
        type: "image/png",
        sizes: "32x32",
        marker: "icon",
      },
      {
        selector: "link[data-knba-dynamic-icon='apple-touch-icon']",
        rel: "apple-touch-icon",
        type: "image/png",
        sizes: "180x180",
        marker: "apple-touch-icon",
      },
    ];

    definitions.forEach((definition) => {
      let link = document.head.querySelector<HTMLLinkElement>(definition.selector);
      if (!link) {
        link = document.createElement("link");
        link.rel = definition.rel;
        link.type = definition.type;
        link.setAttribute("data-knba-dynamic-icon", definition.marker);
        if (definition.sizes) {
          link.sizes = definition.sizes;
        }
        document.head.appendChild(link);
      }

      link.href = faviconHref;
    });
  }, [profile.logo, profile.logo_url, profile.updated_at]);

  return null;
}
