"use client";

import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useOrganizationProfile } from "@/components/organization-profile-provider";
import {
  apiRequest,
  clearAdminSession,
  getStoredAdminSession,
  getUserInitials,
  storeAdminSession,
  type AdminSession,
} from "@/lib/api";
import { resolveOrganizationImageSrc } from "@/lib/organization-profile";
import { adminNavItems } from "@/lib/site-data";

type TopbarMessage = {
  id: string;
  name: string;
  topic: string;
  date: string;
  message: string;
  isRead: boolean;
  href: string;
};

const adminThemes = [
  {
    id: "knba",
    label: "KNBA Blue",
    headerStart: "#273c75",
    headerEnd: "#1e3799",
    sidebar: "#101a35",
    sidebarHover: "#162552",
    accentStart: "#273c75",
    accentEnd: "#1e3799",
    headerText: "#ffffff",
    mutedText: "rgba(255,255,255,0.82)",
    sidebarText: "#ffffff",
    sidebarMutedText: "rgba(255,255,255,0.76)",
    border: "rgba(255,255,255,0.14)",
    activeBg: "linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.08))",
    logoutBg: "#101a35",
  },
  {
    id: "light",
    label: "Soft Light",
    headerStart: "#f7f9ff",
    headerEnd: "#e8eefc",
    sidebar: "#f8fbff",
    sidebarHover: "#e9f0ff",
    accentStart: "#dfe8ff",
    accentEnd: "#c8d7ff",
    headerText: "#16213f",
    mutedText: "#4a5a86",
    sidebarText: "#16213f",
    sidebarMutedText: "#52648f",
    border: "rgba(22,33,63,0.12)",
    activeBg: "linear-gradient(135deg, rgba(39,60,117,0.12), rgba(30,55,153,0.08))",
    logoutBg: "#101a35",
  },
  {
    id: "slate",
    label: "Slate Steel",
    headerStart: "#334155",
    headerEnd: "#1e293b",
    sidebar: "#0f172a",
    sidebarHover: "#1e293b",
    accentStart: "#475569",
    accentEnd: "#334155",
    headerText: "#ffffff",
    mutedText: "rgba(255,255,255,0.82)",
    sidebarText: "#ffffff",
    sidebarMutedText: "rgba(255,255,255,0.76)",
    border: "rgba(255,255,255,0.14)",
    activeBg: "linear-gradient(135deg, rgba(255,255,255,0.16), rgba(255,255,255,0.08))",
    logoutBg: "#0f172a",
  },
  {
    id: "emerald",
    label: "Emerald",
    headerStart: "#0f766e",
    headerEnd: "#115e59",
    sidebar: "#042f2e",
    sidebarHover: "#134e4a",
    accentStart: "#0f766e",
    accentEnd: "#14b8a6",
    headerText: "#ffffff",
    mutedText: "rgba(255,255,255,0.82)",
    sidebarText: "#ffffff",
    sidebarMutedText: "rgba(255,255,255,0.76)",
    border: "rgba(255,255,255,0.14)",
    activeBg: "linear-gradient(135deg, rgba(255,255,255,0.16), rgba(255,255,255,0.08))",
    logoutBg: "#042f2e",
  },
  {
    id: "maroon",
    label: "Maroon Gold",
    headerStart: "#7f1d1d",
    headerEnd: "#991b1b",
    sidebar: "#450a0a",
    sidebarHover: "#7f1d1d",
    accentStart: "#991b1b",
    accentEnd: "#b45309",
    headerText: "#ffffff",
    mutedText: "rgba(255,255,255,0.82)",
    sidebarText: "#ffffff",
    sidebarMutedText: "rgba(255,255,255,0.76)",
    border: "rgba(255,255,255,0.14)",
    activeBg: "linear-gradient(135deg, rgba(255,255,255,0.16), rgba(255,255,255,0.08))",
    logoutBg: "#450a0a",
  },
];

type ApiMessage = {
  id: number;
  full_name: string;
  subject: string;
  message: string;
  created_at: string;
  is_read: boolean;
};

type BusinessSubmissionPreview = {
  id: number;
  submitter_name: string;
  name: string;
  category: string;
  description: string;
  created_at: string;
  review_status: string;
  is_read: boolean;
};

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile } = useOrganizationProfile();
  const adminNavigation = useMemo(
    () =>
      adminNavItems.map((item) =>
        item.label === "Members"
          ? {
              ...item,
              children: [
                { label: "Term", href: "/admin/members/terms", icon: "+" },
                { label: "Member", href: "/admin/members/members", icon: "+" },
              ],
            }
          : item,
      ),
    [],
  );
  const [hydrated, setHydrated] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [themePanelOpen, setThemePanelOpen] = useState(false);
  const [activeThemeId, setActiveThemeId] = useState(adminThemes[0].id);
  const [session, setSession] = useState<AdminSession | null>(null);
  const [topbarMessages, setTopbarMessages] = useState<TopbarMessage[]>([]);
  const profileRef = useRef<HTMLDivElement | null>(null);
  const messageRef = useRef<HTMLDivElement | null>(null);
  const flattenedAdminNavigation = useMemo(
    () =>
      adminNavigation.flatMap((item) =>
        "children" in item && item.children?.length ? [item, ...item.children] : [item],
      ),
    [adminNavigation],
  );
  const activeNavItem =
    flattenedAdminNavigation.find((item) => item.href === pathname) ??
    adminNavigation.find((item) => pathname.startsWith(`${item.href}/`)) ??
    adminNavigation[0];
  const activeTheme =
    adminThemes.find((theme) => theme.id === activeThemeId) ?? adminThemes[0];
  const accessToken = session?.access;

  const unreadMessages = useMemo(
    () => topbarMessages.length,
    [topbarMessages],
  );

  const themeVars: CSSProperties = {
    ["--admin-sidebar-bg" as string]: activeTheme.sidebar,
    ["--admin-sidebar-hover" as string]: activeTheme.sidebarHover,
    ["--admin-header-start" as string]: activeTheme.headerStart,
    ["--admin-header-end" as string]: activeTheme.headerEnd,
    ["--admin-accent-start" as string]: activeTheme.accentStart,
    ["--admin-accent-end" as string]: activeTheme.accentEnd,
    ["--admin-header-text" as string]: activeTheme.headerText,
    ["--admin-muted-text" as string]: activeTheme.mutedText,
    ["--admin-sidebar-text" as string]: activeTheme.sidebarText,
    ["--admin-sidebar-muted-text" as string]: activeTheme.sidebarMutedText,
    ["--admin-border" as string]: activeTheme.border,
    ["--admin-active-bg" as string]: activeTheme.activeBg,
    ["--admin-logout-bg" as string]: activeTheme.logoutBg,
  };

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!profileRef.current?.contains(event.target as Node)) {
        setProfileOpen(false);
      }
      if (!messageRef.current?.contains(event.target as Node)) {
        setMessageOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSession(getStoredAdminSession());
      setHydrated(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    if (!session) {
      router.replace("/login");
    }
  }, [hydrated, router, session]);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    let isCancelled = false;
    const formatDate = new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const loadAdminState = async () => {
      try {
        const [user, messages, businessSubmissions] = await Promise.all([
          apiRequest<AdminSession["user"]>("/auth/me/", {
            token: accessToken,
          }),
          apiRequest<ApiMessage[]>("/contact-submissions/", {
            token: accessToken,
          }),
          apiRequest<BusinessSubmissionPreview[]>(
            "/business-showcase-submissions/?status=pending",
            {
              token: accessToken,
            },
          ),
        ]);

        if (isCancelled) {
          return;
        }

        setSession((current) => {
          if (!current) {
            return current;
          }

          const nextSession = { ...current, user };
          storeAdminSession(nextSession);
          return nextSession;
        });
        setTopbarMessages(
          [
            ...messages.map((message) => ({
              id: `contact-${message.id}`,
              name: message.full_name,
              topic: message.subject,
              date: formatDate.format(new Date(message.created_at)),
              message: message.message,
              isRead: message.is_read,
              href: `/admin/messages?message_type=contact&message_id=${message.id}`,
              createdAt: message.created_at,
            })),
            ...businessSubmissions.map((submission) => ({
              id: `business-${submission.id}`,
              name: submission.submitter_name,
              topic: `Business Showcase: ${submission.name}`,
              date: formatDate.format(new Date(submission.created_at)),
              message: submission.description || `${submission.category} business submission`,
              isRead: submission.is_read,
              href: `/admin/messages?message_type=business&message_id=${submission.id}`,
              createdAt: submission.created_at,
            })),
          ]
            .filter((message) => !message.isRead)
            .sort(
              (left, right) =>
                new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
            )
            .slice(0, 5)
            .map((message) => ({
              id: message.id,
              name: message.name,
              topic: message.topic,
              date: message.date,
              message: message.message,
              isRead: message.isRead,
              href: message.href,
            })),
        );
      } catch {
        if (isCancelled) {
          return;
        }

        clearAdminSession();
        setSession(null);
        router.replace("/login");
      }
    };

    void loadAdminState();

    return () => {
      isCancelled = true;
    };
  }, [accessToken, pathname, router]);

  const handleLogout = () => {
    clearAdminSession();
    setProfileOpen(false);
    setMessageOpen(false);
    setSession(null);
    router.push("/login");
  };

  if (!hydrated || !session) {
    return <div className="min-h-screen bg-[#eef2f9]" />;
  }

  return (
    <div className="min-h-screen bg-[#eef2f9]" style={themeVars}>
      <div
        className={`transition-all duration-300 ${
          sidebarCollapsed ? "xl:pl-24" : "xl:pl-72"
        }`}
      >
        <aside
          className={`fixed inset-y-0 left-0 z-40 bg-[#101a35] transition-all duration-300 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } ${sidebarCollapsed ? "w-24" : "w-72"} xl:translate-x-0`}
          style={{ backgroundColor: "var(--admin-sidebar-bg)" }}
        >
          <div className="flex h-screen flex-col overflow-hidden p-4">
            <div
              className={`flex items-center ${
                sidebarCollapsed ? "justify-center" : "justify-between gap-3"
              }`}
            >
              <Link
                href="/admin"
                className={`flex items-center ${sidebarCollapsed ? "justify-center" : "gap-3"}`}
              >
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl font-black"
                  style={{
                    backgroundImage:
                      "linear-gradient(135deg,var(--admin-accent-start),var(--admin-accent-end))",
                    color: "var(--admin-header-text)",
                  }}
                >
                  {profile.logo_url ? (
                    <img
                      src={resolveOrganizationImageSrc(profile.logo_url)}
                      alt={profile.short_name}
                      className="h-full w-full object-contain p-2"
                    />
                  ) : (
                    profile.short_name.slice(0, 1)
                  )}
                </div>
                {!sidebarCollapsed ? (
                  <div>
                    <p
                      className="text-xs font-semibold uppercase tracking-[0.24em]"
                      style={{ color: "var(--admin-sidebar-muted-text)" }}
                    >
                      {profile.short_name}
                    </p>
                    <p
                      className="text-lg font-bold"
                      style={{ color: "var(--admin-sidebar-text)" }}
                    >
                      Admin Panel
                    </p>
                  </div>
                ) : null}
              </Link>
              {!sidebarCollapsed ? (
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl xl:hidden"
                  style={{
                    border: "1px solid var(--admin-border)",
                    color: "var(--admin-sidebar-text)",
                  }}
                  aria-label="Close sidebar"
                >
                  x
                </button>
              ) : null}
            </div>

            <div className="mt-6 min-h-0 flex-1 overflow-y-auto pr-1">
              <nav className="space-y-2">
                {adminNavigation.map((item) => {
                  const isItemActive =
                    pathname === item.href ||
                    ("children" in item &&
                      Boolean(item.children?.some((child) => child.href === pathname)));
                  const childItems =
                    "children" in item && item.children?.length ? item.children : [];

                  return (
                    <div key={item.href} className="space-y-1">
                      <Link
                        href={item.href}
                        data-active={isItemActive}
                        className={`rounded-[0.9rem] font-semibold transition ${
                          sidebarCollapsed ? "justify-center px-3" : ""
                        }`}
                        onClick={() => setSidebarOpen(false)}
                        title={sidebarCollapsed ? item.label : undefined}
                        style={{
                          display: "flex",
                          gap: "0.8rem",
                          padding: "0.85rem 1rem",
                          color: isItemActive
                            ? "var(--admin-sidebar-text)"
                            : "var(--admin-sidebar-muted-text)",
                          background: isItemActive ? "var(--admin-active-bg)" : "transparent",
                        }}
                      >
                        <span className="text-lg leading-none">{item.icon}</span>
                        {!sidebarCollapsed ? <span>{item.label}</span> : null}
                      </Link>

                      {!sidebarCollapsed && childItems.length && pathname.startsWith("/admin/members") ? (
                        <div className="space-y-1 pl-5">
                          {childItems.map((child) => {
                            const isChildActive = pathname === child.href;

                            return (
                              <Link
                                key={child.href}
                                href={child.href}
                                onClick={() => setSidebarOpen(false)}
                                className="flex items-center gap-3 rounded-[0.8rem] px-3 py-2 text-sm font-semibold transition"
                                style={{
                                  color: isChildActive
                                    ? "var(--admin-sidebar-text)"
                                    : "var(--admin-sidebar-muted-text)",
                                  background: isChildActive
                                    ? "var(--admin-active-bg)"
                                    : "transparent",
                                }}
                              >
                                <span className="text-base leading-none">{child.icon}</span>
                                <span>{child.label}</span>
                              </Link>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </nav>
            </div>

            <div className="mt-4 border-t border-white/10 pt-4">
              <button
                type="button"
                onClick={handleLogout}
                className={`inline-flex w-full items-center justify-center rounded-full border border-white px-4 py-2.5 text-sm font-bold !text-white transition hover:!text-white ${
                  sidebarCollapsed ? "px-2 text-xs" : ""
                }`}
                title={sidebarCollapsed ? "Logout" : undefined}
                style={{
                  backgroundColor: "var(--admin-logout-bg)",
                  color: "var(--admin-sidebar-text)",
                  borderColor: "var(--admin-border)",
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header
            className="sticky top-0 z-30 px-4 py-1.5 shadow-[0_12px_28px_rgba(18,31,69,0.16)] md:px-5"
            style={{
              borderBottom: "1px solid var(--admin-border)",
              backgroundImage:
                "linear-gradient(135deg,var(--admin-header-start),var(--admin-header-end))",
            }}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== "undefined" && window.innerWidth >= 1280) {
                      setSidebarCollapsed((value) => !value);
                      return;
                    }
                    setSidebarOpen(true);
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold transition"
                  style={{
                    border: "1px solid var(--admin-border)",
                    background: "color-mix(in srgb, var(--admin-header-text) 10%, transparent)",
                    color: "var(--admin-header-text)",
                  }}
                  aria-label="Toggle sidebar"
                >
                  {sidebarCollapsed ? ">" : "="}
                </button>
                <p
                  className="text-sm font-semibold"
                  style={{ color: "var(--admin-header-text)" }}
                >
                  {activeNavItem.label}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative" ref={messageRef}>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setMessageOpen((value) => !value);
                      setProfileOpen(false);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setMessageOpen((value) => !value);
                        setProfileOpen(false);
                      }
                    }}
                    className="relative flex cursor-pointer items-center transition"
                    style={{ color: "var(--admin-header-text)" }}
                    aria-label="Open messages"
                  >
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                    >
                      <path
                        d="M4 6.5C4 5.12 5.12 4 6.5 4H17.5C18.88 4 20 5.12 20 6.5V17.5C20 18.88 18.88 20 17.5 20H6.5C5.12 20 4 18.88 4 17.5V6.5Z"
                        stroke="currentColor"
                        strokeWidth="1.6"
                      />
                      <path
                        d="M7 8L12 12L17 8"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {unreadMessages > 0 ? (
                      <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#eb2f06] px-1 text-[10px] font-bold text-white">
                        {unreadMessages}
                      </span>
                    ) : null}
                  </div>

                  {messageOpen ? (
                    <div className="absolute right-0 top-[calc(100%+0.6rem)] w-72 rounded-[1rem] border border-slate-200 bg-white p-2 shadow-[0_18px_40px_rgba(18,31,69,0.12)]">
                      <div className="border-b border-slate-100 px-3 py-2">
                        <p className="text-sm font-bold text-slate-800">
                          {unreadMessages} unread messages
                        </p>
                        <p className="text-xs text-slate-500">
                          Recent message previews
                        </p>
                      </div>
                      <div className="mt-1 space-y-1">
                        {topbarMessages.length ? topbarMessages.slice(0, 3).map((message) => (
                          <Link
                            key={message.id}
                            href={message.href}
                            onClick={() => {
                              setMessageOpen(false);
                              setTopbarMessages((current) =>
                                current.filter((item) => item.id !== message.id),
                              );
                            }}
                            className="rounded-[0.8rem] px-3 py-2.5 transition hover:bg-slate-50"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <p className="text-sm font-semibold text-slate-800">
                                {message.name}
                              </p>
                              <span className="text-[11px] font-semibold text-slate-400">
                                {message.date}
                              </span>
                            </div>
                            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-primary-soft">
                              {message.topic}
                            </p>
                            <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                              {message.message}
                            </p>
                          </Link>
                        )) : (
                          <div className="rounded-[0.8rem] px-3 py-3 text-sm text-slate-500">
                            No unread messages.
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="relative" ref={profileRef}>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setProfileOpen((value) => !value);
                      setMessageOpen(false);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setProfileOpen((value) => !value);
                        setMessageOpen(false);
                      }
                    }}
                    className="flex cursor-pointer items-center gap-2 transition"
                    style={{ color: "var(--admin-header-text)" }}
                    aria-label="Open profile menu"
                  >
                    <div
                      className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold"
                      style={{
                        background:
                          "color-mix(in srgb, var(--admin-header-text) 14%, transparent)",
                        color: "var(--admin-header-text)",
                      }}
                    >
                      {getUserInitials(session.user)}
                    </div>
                    <span className="hidden text-xs font-semibold sm:block">
                      {session.user.full_name}
                    </span>
                    <span className="text-[9px]">v</span>
                  </div>

                  {profileOpen ? (
                    <div className="absolute right-0 top-[calc(100%+0.6rem)] w-52 rounded-[1rem] border border-slate-200 bg-white p-2 shadow-[0_18px_40px_rgba(18,31,69,0.12)]">
                      <Link
                        href="/admin/settings"
                        className="block rounded-[0.8rem] px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        onClick={() => setProfileOpen(false)}
                      >
                        Profile
                      </Link>
                      <Link
                        href="/admin/settings"
                        className="block rounded-[0.8rem] px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        onClick={() => setProfileOpen(false)}
                      >
                        Password Change
                      </Link>
                      <button
                        type="button"
                        className="block w-full rounded-[0.8rem] px-3 py-2.5 text-left text-sm font-semibold !text-white transition hover:!text-white"
                        style={{ backgroundColor: "var(--admin-logout-bg)" }}
                        onClick={handleLogout}
                      >
                        Logout
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </header>

          <main className="p-4 md:p-6">{children}</main>
        </div>
      </div>

      <div
        className={`fixed right-0 top-20 z-30 transition-transform duration-300 ${
          themePanelOpen ? "translate-x-0" : "translate-x-[calc(100%-1.7rem)]"
        }`}
      >
        <div className="flex overflow-hidden rounded-l-[1.2rem] border border-slate-200 bg-white shadow-[0_18px_40px_rgba(18,31,69,0.14)]">
          <button
            type="button"
            onClick={() => setThemePanelOpen((value) => !value)}
            className="flex h-20 w-[1.7rem] items-center justify-center self-start bg-[linear-gradient(180deg,#273c75,#1e3799)] text-[9px] font-bold uppercase tracking-[0.08em] text-white [writing-mode:vertical-rl]"
            aria-label="Open theme panel"
          >
            Theme
          </button>
          <div className="w-72 p-4">
            <p className="text-sm font-bold text-slate-800">Dashboard Theme</p>
            <p className="mt-1 text-xs leading-6 text-slate-500">
              Choose a color set for the admin sidebar and top bar.
            </p>
            <div className="mt-4 grid gap-3">
              {adminThemes.map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => setActiveThemeId(theme.id)}
                  className={`rounded-[1rem] border p-3 text-left transition ${
                    activeThemeId === theme.id
                      ? "border-primary bg-[#f7f9ff]"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="h-8 w-8 rounded-full border border-white shadow"
                      style={{
                        backgroundImage: `linear-gradient(135deg, ${theme.headerStart}, ${theme.headerEnd})`,
                      }}
                    />
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {theme.label}
                      </p>
                      <div className="mt-1 flex gap-1.5">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: theme.sidebar }}
                        />
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: theme.headerStart }}
                        />
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: theme.headerEnd }}
                        />
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      {sidebarOpen ? (
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-[#091224]/45 xl:hidden"
          aria-label="Close sidebar overlay"
        />
      ) : null}
    </div>
  );
}
