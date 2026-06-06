"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useOrganizationProfile } from "@/components/organization-profile-provider";
import { apiRequest, storeAdminSession, type AdminSession } from "@/lib/api";
import { moveToNextFormField, resetEnterNavigationState } from "@/lib/enter-navigation";
import { resolveOrganizationImageSrc } from "@/lib/organization-profile";

export function AdminLoginForm() {
  const router = useRouter();
  const { profile } = useOrganizationProfile();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="w-full max-w-md">
      <div className="mb-5 flex items-center gap-3">
        {profile.logo_url ? (
          <div className="relative h-16 w-24 overflow-hidden">
            <Image
              src={resolveOrganizationImageSrc(profile.logo_url)}
              alt={profile.short_name}
              fill
              unoptimized
              className="object-contain"
            />
          </div>
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-line bg-white text-xl font-black text-primary">
            {profile.short_name.slice(0, 1)}
          </div>
        )}
        <div>
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-primary-soft">
            Admin Portal
          </p>
          <p className="text-sm font-medium text-slate-600">{profile.organization_name}</p>
        </div>
      </div>
      <form
        className="mt-6 space-y-5"
        onKeyDown={moveToNextFormField}
        onBlurCapture={resetEnterNavigationState}
        onSubmit={async (event) => {
          event.preventDefault();
          setSubmitting(true);
          setError("");

          try {
            const session = await apiRequest<AdminSession>("/auth/login/", {
              method: "POST",
              body: {
                login,
                password,
              },
            });
            storeAdminSession(session);
            router.push("/admin");
            router.refresh();
          } catch (requestError) {
            setError(
              requestError instanceof Error
                ? requestError.message
                : "Unable to sign in right now.",
            );
          } finally {
            setSubmitting(false);
          }
        }}
      >
        <input
          type="text"
          required
          autoComplete="username"
          placeholder="Email or username"
          value={login}
          onChange={(event) => setLogin(event.target.value)}
          className="w-full rounded-[1rem] border border-line bg-[#f7f9ff] px-4 py-3 outline-none transition focus:border-primary"
        />
        <input
          type="password"
          required
          autoComplete="current-password"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-[1rem] border border-line bg-[#f7f9ff] px-4 py-3 outline-none transition focus:border-primary"
        />
        {error ? (
          <div className="rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {error}
          </div>
        ) : null}
        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? "Signing In..." : "Login"}
        </button>
      </form>
    </div>
  );
}
