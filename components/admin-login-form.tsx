"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiRequest, storeAdminSession, type AdminSession } from "@/lib/api";

export function AdminLoginForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [login, setLogin] = useState("admin@knba.org.np");
  const [password, setPassword] = useState("knba-admin");

  return (
    <div className="w-full max-w-md">
      <h1 className="text-3xl font-bold text-primary">
        Sign in to the admin dashboard.
      </h1>

      <form
        className="mt-6 space-y-5"
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
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-primary">
            Email or Username
          </span>
          <input
            type="text"
            required
            value={login}
            onChange={(event) => setLogin(event.target.value)}
            className="w-full rounded-[1rem] border border-line bg-[#f7f9ff] px-4 py-3 outline-none transition focus:border-primary"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-primary">
            Password
          </span>
          <input
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-[1rem] border border-line bg-[#f7f9ff] px-4 py-3 outline-none transition focus:border-primary"
          />
        </label>
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
