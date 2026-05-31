"use client";

import { useEffect, useRef, useState } from "react";
import { NepalFlagIcon } from "@/components/nepal-flag-icon";
import { useOrganizationProfile } from "@/components/organization-profile-provider";
import { API_BASE_URL, MEDIA_BASE_URL, getValidAdminAccessToken } from "@/lib/api";
import {
  focusFirstFormField,
  moveToNextFormField,
  preventMouseOnlyUploadKeyboard,
  resetEnterNavigationState,
} from "@/lib/enter-navigation";

type OrganizationProfile = {
  id: number;
  organization_name: string;
  short_name: string;
  office_address: string;
  phone_number: string;
  email: string;
  logo: string | null;
  logo_url: string;
  map_embed_url: string;
  is_active: boolean;
};

type ProfileFormState = {
  organization_name: string;
  short_name: string;
  office_address: string;
  phone_number: string;
  email: string;
  map_embed_url: string;
  is_active: boolean;
};

const emptyForm: ProfileFormState = {
  organization_name: "",
  short_name: "",
  office_address: "",
  phone_number: "",
  email: "",
  map_embed_url: "",
  is_active: false,
};

async function getAuthHeaders() {
  const accessToken = await getValidAdminAccessToken();
  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

function getApiErrorMessage(data: unknown, fallback: string) {
  if (data && typeof data === "object") {
    if ("detail" in data && typeof data.detail === "string") {
      return data.detail;
    }

    const entries = Object.entries(data)
      .map(([field, value]) => {
        if (Array.isArray(value) && value.length) {
          return `${field}: ${value.join(" ")}`;
        }
        if (typeof value === "string") {
          return `${field}: ${value}`;
        }
        return "";
      })
      .filter(Boolean);

    if (entries.length) {
      return entries.join(" ");
    }
  }

  return fallback;
}

function parseApiPayload(rawText: string) {
  if (!rawText.trim()) {
    return null;
  }

  try {
    return JSON.parse(rawText) as unknown;
  } catch {
    return rawText;
  }
}

function resolveImageSrc(src: string) {
  if (!src) {
    return "";
  }

  if (/^(https?:|blob:|data:)/i.test(src)) {
    return src;
  }

  return `${MEDIA_BASE_URL}${src.startsWith("/") ? src : `/${src}`}`;
}

function toTitleCase(value: string) {
  return value.replace(/\b([a-z])/g, (match) => match.toUpperCase());
}

const NEPAL_COUNTRY_CODE = "+977";

function getLocalNepalPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("977") && digits.length >= 13) {
    return digits.slice(3, 13);
  }
  if (digits.startsWith("0") && digits.length >= 11) {
    return digits.slice(1, 11);
  }
  return digits.slice(0, 10);
}

function formatNepalPhone(value: string) {
  const localNumber = getLocalNepalPhone(value);
  return localNumber ? `${NEPAL_COUNTRY_CODE}-${localNumber}` : "";
}

export function AdminOrganizationProfileCard() {
  const { refreshProfile } = useOrganizationProfile();
  const [profiles, setProfiles] = useState<OrganizationProfile[]>([]);
  const [form, setForm] = useState<ProfileFormState>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState("");
  const [logoMarkedForRemoval, setLogoMarkedForRemoval] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const formRef = useRef<HTMLFormElement | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  const editingProfile = editingId
    ? profiles.find((item) => item.id === editingId) ?? null
    : null;
  const logoDisplayUrl =
    !logoMarkedForRemoval && (logoPreviewUrl || editingProfile?.logo_url || "");

  const loadProfiles = async () => {
    const response = await fetch(`${API_BASE_URL}/organization-profiles/`, {
      headers: await getAuthHeaders(),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Unable to load organization profiles.");
    }

    const data = (await response.json()) as OrganizationProfile[];
    setProfiles(data);
  };

  useEffect(() => {
    let isCancelled = false;

    const run = async () => {
      try {
        if (!isCancelled) {
          await loadProfiles();
        }
      } catch (requestError) {
        if (!isCancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load organization profiles.",
          );
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    void run();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!logoFile) {
      setLogoPreviewUrl("");
      return;
    }

    const nextUrl = URL.createObjectURL(logoFile);
    setLogoPreviewUrl(nextUrl);
    return () => URL.revokeObjectURL(nextUrl);
  }, [logoFile]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setLogoFile(null);
    setLogoMarkedForRemoval(false);
    setPhoneError("");
  };

  const openCreateForm = () => {
    resetForm();
    setError("");
    setSuccess("");
    setFormOpen(true);
  };

  const openEditForm = (profile: OrganizationProfile) => {
    setForm({
      organization_name: profile.organization_name,
      short_name: profile.short_name,
      office_address: profile.office_address,
      phone_number: getLocalNepalPhone(profile.phone_number),
      email: profile.email,
      map_embed_url: profile.map_embed_url,
      is_active: profile.is_active,
    });
    setEditingId(profile.id);
    setLogoFile(null);
    setLogoMarkedForRemoval(false);
    setError("");
    setSuccess("");
    setFormOpen(true);
  };

  return (
    <section className="space-y-5">
      <div className="admin-master-panel px-6 py-5 md:px-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-[1rem] font-semibold uppercase tracking-[0.08em] text-primary">
              Organizational Profile
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              if (formOpen && editingId === null) {
                setFormOpen(false);
                return;
              }
              openCreateForm();
            }}
            className="admin-master-btn admin-master-btn-primary"
          >
            {formOpen && editingId === null ? "Close Form" : "Add Profile"}
          </button>
        </div>
      </div>

      {!formOpen && error ? (
        <div className="rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </div>
      ) : null}

      {!formOpen && success ? (
        <div className="rounded-[1rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {success}
        </div>
      ) : null}

      {formOpen ? (
        <form
          ref={formRef}
          className="rounded-[1.2rem] border border-[rgba(39,60,117,0.12)] bg-[linear-gradient(180deg,#dbe7ff_0%,#c9d9fb_100%)] p-4 shadow-[0_18px_40px_rgba(18,31,69,0.06)] md:p-5"
          onKeyDown={moveToNextFormField}
          onBlurCapture={resetEnterNavigationState}
          onSubmit={async (event) => {
            event.preventDefault();
            setSaving(true);
            setError("");
            setSuccess("");

            try {
              const isEditing = editingId !== null;
              if (form.phone_number.length !== 10) {
                setPhoneError("Enter exactly 10 digits after +977.");
                throw new Error("Enter exactly 10 digits after +977.");
              }

              const payload = new FormData();
              payload.append("organization_name", form.organization_name);
              payload.append("short_name", form.short_name);
              payload.append("office_address", form.office_address);
              payload.append("phone_number", `${NEPAL_COUNTRY_CODE}-${form.phone_number}`);
              payload.append("email", form.email);
              payload.append("map_embed_url", form.map_embed_url);
              payload.append("is_active", String(form.is_active));

              if (logoFile) {
                payload.append("logo", logoFile);
              }
              if (logoMarkedForRemoval && !logoFile) {
                payload.append("logo_clear", "1");
              }

              const response = await fetch(
                editingId
                  ? `${API_BASE_URL}/organization-profiles/${editingId}/`
                  : `${API_BASE_URL}/organization-profiles/`,
                {
                  method: editingId ? "PATCH" : "POST",
                  headers: await getAuthHeaders(),
                  body: payload,
                },
              );

              const rawText = await response.text();
              const data = parseApiPayload(rawText);
              if (!response.ok) {
                if (typeof data === "string" && data.trim()) {
                  throw new Error(
                    data.length > 220
                      ? `${data.slice(0, 220).trim()}...`
                      : data,
                  );
                }
                throw new Error(
                  getApiErrorMessage(
                    data,
                    `Unable to save organization profile. (${response.status})`,
                  ),
                );
              }

              await loadProfiles();
              await refreshProfile();
              resetForm();
              if (isEditing) {
                setFormOpen(false);
              } else {
                setFormOpen(true);
                requestAnimationFrame(() => focusFirstFormField(formRef.current));
              }
              setSuccess(
                isEditing
                  ? "Organization profile updated successfully."
                  : "Organization profile added successfully.",
              );
            } catch (requestError) {
              setError(
                requestError instanceof Error
                  ? requestError.message
                  : "Unable to save organization profile.",
              );
            } finally {
              setSaving(false);
            }
          }}
        >
          <div className="mx-auto max-w-[50rem]">
            <div className="mx-auto grid w-full justify-center gap-3 md:grid-cols-2 md:gap-x-8">
              <label className="admin-master-label w-full max-w-[22rem]">
                <span>Organization Name</span>
                <input
                  type="text"
                  value={form.organization_name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      organization_name: toTitleCase(event.target.value),
                    }))
                  }
                  className="admin-master-input"
                  required
                />
              </label>
              <label className="admin-master-label w-full max-w-[22rem]">
                <span>Short Name</span>
                <input
                  type="text"
                  value={form.short_name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      short_name: toTitleCase(event.target.value),
                    }))
                  }
                  className="admin-master-input"
                  required
                />
              </label>
              <label className="admin-master-label w-full max-w-[22rem]">
                <span>Office Address</span>
                <input
                  type="text"
                  value={form.office_address}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      office_address: toTitleCase(event.target.value),
                    }))
                  }
                  className="admin-master-input"
                  required
                />
              </label>
              <label className="admin-master-label w-full max-w-[22rem]">
                <span>Phone No.</span>
                <div className="flex items-center overflow-hidden rounded-[0.9rem] border border-[rgba(39,60,117,0.12)] bg-white">
                  <span className="flex min-h-[1.8rem] items-center border-r border-[rgba(39,60,117,0.1)] px-3 leading-none">
                    <NepalFlagIcon className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={10}
                    value={form.phone_number}
                    onChange={(event) => {
                      const digitsOnly = event.target.value.replace(/\D/g, "");
                      if (digitsOnly.length > 10) {
                        setPhoneError("Only 10 digits are allowed after +977.");
                        return;
                      }
                      setPhoneError(
                        digitsOnly.length > 0 && digitsOnly.length < 10
                          ? "Enter exactly 10 digits after +977."
                          : "",
                      );
                      setForm((current) => ({
                        ...current,
                        phone_number: digitsOnly,
                      }));
                    }}
                    className="admin-master-input rounded-none border-0 shadow-none focus:shadow-none"
                    required
                  />
                </div>
                {phoneError ? (
                  <p className="mt-1 text-[0.68rem] font-medium text-rose-700">{phoneError}</p>
                ) : null}
              </label>
              <label className="admin-master-label w-full max-w-[22rem]">
                <span>Email</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, email: event.target.value }))
                  }
                  className="admin-master-input"
                  required
                />
              </label>
              <label className="admin-master-label w-full max-w-[22rem]">
                <span>Map Url</span>
                <input
                  type="text"
                  value={form.map_embed_url}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      map_embed_url: event.target.value,
                    }))
                }
                className="admin-master-input"
              />
            </label>
              <label className="admin-master-label w-full max-w-[22rem] md:col-start-1">
                <span>Logo</span>
                <div className="flex min-h-[4rem] w-[52%] min-w-[12.5rem] items-center justify-between gap-3 rounded-[1rem] border border-dashed border-[rgba(39,60,117,0.18)] bg-white/80 px-3 py-2">
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(event) => {
                      setLogoFile(event.target.files?.[0] ?? null);
                      setLogoMarkedForRemoval(false);
                    }}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    onKeyDown={preventMouseOnlyUploadKeyboard}
                    className="admin-master-btn admin-master-btn-secondary min-h-[1.65rem] min-w-[5.2rem] px-2 py-1 text-[0.62rem] font-medium"
                    style={{ fontSize: "0.62rem", fontWeight: 500 }}
                  >
                    Upload Logo
                  </button>
                  {logoDisplayUrl ? (
                    <div className="group relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                      <img
                        src={resolveImageSrc(logoDisplayUrl)}
                        alt="Logo preview"
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setLogoFile(null);
                          setLogoPreviewUrl("");
                          setLogoMarkedForRemoval(true);
                          if (logoInputRef.current) {
                            logoInputRef.current.value = "";
                          }
                        }}
                        className="absolute inset-0 flex items-center justify-center bg-[#091224]/0 text-base font-semibold text-white opacity-0 transition group-hover:bg-[#091224]/70 group-hover:opacity-100"
                        aria-label="Remove logo"
                      >
                        x
                      </button>
                    </div>
                  ) : null}
                </div>
              </label>
            </div>

            <label className="mt-3 inline-flex items-center gap-2 text-[0.62rem] font-medium uppercase tracking-[0.08em] text-slate-700">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(event) =>
                  setForm((current) => ({ ...current, is_active: event.target.checked }))
                }
              />
              Active
            </label>

            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="admin-master-btn admin-master-btn-primary"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
            {error ? (
              <p className="mt-2 text-right text-[0.72rem] font-medium text-rose-700">
                {error}
              </p>
            ) : null}
            {success ? (
              <p className="mt-2 text-right text-[0.72rem] font-medium text-emerald-700">
                {success}
              </p>
            ) : null}
          </div>
        </form>
      ) : null}

      <section className="admin-card rounded-[1.2rem] p-5 md:p-6">
        <div className="overflow-x-auto">
          <table className="admin-master-table min-w-full border-separate border-spacing-y-2">
            <thead>
              <tr className="text-left">
                <th>Logo</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="rounded-[0.9rem] bg-slate-50 px-3 py-3 text-sm text-slate-500"
                  >
                    Loading profiles...
                  </td>
                </tr>
              ) : profiles.length ? (
                profiles.map((profile) => (
                  <tr key={profile.id}>
                    <td className="rounded-l-[0.9rem] bg-slate-50/90 px-3 py-1.5 text-slate-700">
                      {profile.logo_url ? (
                        <div className="relative h-9 w-9 overflow-hidden rounded-xl">
                          <img
                            src={resolveImageSrc(profile.logo_url)}
                            alt={profile.organization_name}
                            className="h-full w-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-200 text-[10px] font-medium text-slate-500">
                          Logo
                        </div>
                      )}
                    </td>
                    <td className="bg-slate-50/90 px-3 py-1.5 text-sm font-normal text-slate-700">
                      {profile.short_name}
                    </td>
                    <td className="bg-slate-50/90 px-3 py-1.5 text-sm text-slate-600">
                      {formatNepalPhone(profile.phone_number)}
                    </td>
                    <td className="bg-slate-50/90 px-3 py-1.5 text-sm text-slate-600">
                      {profile.email}
                    </td>
                    <td className="bg-slate-50/90 px-3 py-1.5 text-sm">
                      <span
                        className={`admin-badge ${
                          profile.is_active ? "admin-badge-active" : "admin-badge-inactive"
                        }`}
                      >
                        {profile.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="rounded-r-[0.9rem] bg-slate-50/90 px-3 py-1.5 text-right">
                      <div className="flex justify-end gap-2">
                        {!profile.is_active ? (
                          <button
                            type="button"
                            onClick={async () => {
                              setError("");
                              setSuccess("");
                              try {
                                const response = await fetch(
                                  `${API_BASE_URL}/organization-profiles/${profile.id}/activate/`,
                                  {
                                    method: "POST",
                                    headers: await getAuthHeaders(),
                                  },
                                );
                                if (!response.ok) {
                                  throw new Error(
                                    "Unable to activate organization profile.",
                                  );
                                }
                                await loadProfiles();
                                await refreshProfile();
                                setSuccess("Active organization profile updated.");
                              } catch (requestError) {
                                setError(
                                  requestError instanceof Error
                                    ? requestError.message
                                    : "Unable to activate organization profile.",
                                );
                              }
                            }}
                            className="admin-table-btn admin-table-btn-active"
                          >
                            Set Active
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => openEditForm(profile)}
                          className="admin-table-btn admin-table-btn-edit"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            setError("");
                            setSuccess("");
                            try {
                              const response = await fetch(
                                `${API_BASE_URL}/organization-profiles/${profile.id}/`,
                                {
                                  method: "DELETE",
                                  headers: await getAuthHeaders(),
                                },
                              );
                              if (!response.ok) {
                                throw new Error("Unable to delete organization profile.");
                              }
                              if (editingId === profile.id) {
                                resetForm();
                                setFormOpen(false);
                              }
                              await loadProfiles();
                              await refreshProfile();
                              setSuccess("Organization profile deleted.");
                            } catch (requestError) {
                              setError(
                                requestError instanceof Error
                                  ? requestError.message
                                  : "Unable to delete organization profile.",
                              );
                            }
                          }}
                          className="admin-table-btn admin-table-btn-delete"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="rounded-[0.9rem] bg-slate-50 px-3 py-3 text-sm text-slate-500"
                  >
                    No organization profile found yet. Use the Add Profile button
                    to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
