"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { API_BASE_URL } from "@/lib/api";
import {
  defaultOrganizationProfile,
  type OrganizationProfile,
} from "@/lib/organization-profile";

type OrganizationProfileContextValue = {
  profile: OrganizationProfile;
  refreshProfile: () => Promise<void>;
  loading: boolean;
};

const OrganizationProfileContext =
  createContext<OrganizationProfileContextValue | null>(null);

export function OrganizationProfileProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [profile, setProfile] = useState<OrganizationProfile>(
    defaultOrganizationProfile,
  );
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/organization-profiles/current/`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Unable to load organization profile.");
      }

      const data = (await response.json()) as Partial<OrganizationProfile>;
      if (data && typeof data === "object" && data.organization_name) {
        setProfile({
          ...defaultOrganizationProfile,
          ...data,
          logo: typeof data.logo === "string" ? data.logo : "",
          logo_url: data.logo_url ?? "",
          created_at: data.created_at,
          updated_at: data.updated_at,
        });
      } else {
        setProfile(defaultOrganizationProfile);
      }
    } catch {
      setProfile(defaultOrganizationProfile);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshProfile();
  }, [refreshProfile]);

  const value = useMemo(
    () => ({
      profile,
      refreshProfile,
      loading,
    }),
    [loading, profile, refreshProfile],
  );

  return (
    <OrganizationProfileContext.Provider value={value}>
      {children}
    </OrganizationProfileContext.Provider>
  );
}

export function useOrganizationProfile() {
  const context = useContext(OrganizationProfileContext);
  if (!context) {
    throw new Error("useOrganizationProfile must be used within OrganizationProfileProvider.");
  }
  return context;
}
