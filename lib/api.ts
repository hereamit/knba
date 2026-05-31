const DEFAULT_BACKEND_ORIGIN = "http://127.0.0.1:8000";

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

const configuredApiBase = trimTrailingSlash(
  process.env.NEXT_PUBLIC_API_BASE_URL || `${DEFAULT_BACKEND_ORIGIN}/api`,
);

export const API_BASE_URL = configuredApiBase;

export const MEDIA_BASE_URL = trimTrailingSlash(
  process.env.NEXT_PUBLIC_MEDIA_BASE_URL ||
    configuredApiBase.replace(/\/api\/?$/, "") ||
    DEFAULT_BACKEND_ORIGIN,
);

export function resolveBackendAssetUrl(src: string) {
  if (!src) {
    return "";
  }
  if (/^(https?:|blob:|data:)/i.test(src)) {
    return src;
  }
  const normalized = src.startsWith("/") ? src : `/${src}`;
  return `${MEDIA_BASE_URL}${normalized}`;
}

const ADMIN_SESSION_KEY = "knba_admin_session";

export type AdminUser = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
};

export type AdminSession = {
  access: string;
  refresh: string;
  user: AdminUser;
};

type ApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  token?: string;
};

function getErrorMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  if ("detail" in payload && typeof payload.detail === "string") {
    return payload.detail;
  }

  const firstValue = Object.values(payload)[0];
  if (typeof firstValue === "string") {
    return firstValue;
  }
  if (Array.isArray(firstValue) && typeof firstValue[0] === "string") {
    return firstValue[0];
  }

  return fallback;
}

export async function apiRequest<T>(
  path: string,
  { body, headers, token, ...init }: ApiRequestOptions = {},
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (response.status === 204) {
    return null as T;
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(getErrorMessage(payload, "Request failed."));
  }

  return payload as T;
}

export function getStoredAdminSession() {
  if (typeof window === "undefined") {
    return null;
  }

  const rawValue = window.localStorage.getItem(ADMIN_SESSION_KEY);
  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as AdminSession;
  } catch {
    window.localStorage.removeItem(ADMIN_SESSION_KEY);
    return null;
  }
}

export function storeAdminSession(session: AdminSession) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
}

export function clearAdminSession() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(ADMIN_SESSION_KEY);
}

export async function getValidAdminAccessToken() {
  const session = getStoredAdminSession();
  if (!session?.refresh) {
    throw new Error("Admin session not found.");
  }

  const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      refresh: session.refresh,
    }),
  });

  const payload = await refreshResponse.json().catch(() => null);
  if (!refreshResponse.ok || !payload || typeof payload !== "object" || !("access" in payload)) {
    clearAdminSession();
    throw new Error("Session expired. Please sign in again.");
  }

  const nextSession: AdminSession = {
    ...session,
    access: String(payload.access),
  };
  storeAdminSession(nextSession);
  return nextSession.access;
}

export function getUserInitials(user: Pick<AdminUser, "full_name" | "username"> | null) {
  if (!user) {
    return "AD";
  }

  const source = user.full_name || user.username;
  const initials = source
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return initials || "AD";
}
