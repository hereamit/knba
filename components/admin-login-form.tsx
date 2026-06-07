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
  const [showPassword, setShowPassword] = useState(false);

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
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-[1rem] border border-line bg-[#f7f9ff] px-4 py-3 pr-12 outline-none transition focus:border-primary"
          />
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-500 transition hover:text-primary"
          >
            {showPassword ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a19.79 19.79 0 0 1 5.06-6.06" />
                <path d="M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a19.86 19.86 0 0 1-3.17 4.19" />
                <path d="M14.12 14.12A3 3 0 0 1 9.88 9.88" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
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
