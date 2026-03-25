"use client";

import { useEffect, useMemo, useState } from "react";
import { SectionHeading } from "@/components/section-heading";
import { API_BASE_URL } from "@/lib/api";
import {
  normalizeMemberRecord,
  normalizeMemberTermRecord,
  resolveMemberPhotoSrc,
  sortMembers,
  type MemberRecord,
  type MemberTermRecord,
} from "@/lib/members";

function chunkMembers(members: MemberRecord[], size: number) {
  const chunks: MemberRecord[][] = [];

  for (let index = 0; index < members.length; index += size) {
    chunks.push(members.slice(index, index + size));
  }

  return chunks;
}

function ContactLine({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href: string;
}) {
  return (
    <p className="break-words text-sm leading-6 text-muted">
      <span className="font-semibold text-primary">{label}:</span>{" "}
      <a href={href} className="transition hover:text-primary-soft">
        {value}
      </a>
    </p>
  );
}

function MemberCard({
  member,
  className = "",
}: {
  member: MemberRecord;
  className?: string;
}) {
  const photoSrc = resolveMemberPhotoSrc(member.photo_src);

  return (
    <article
      className={`panel h-full rounded-[1.8rem] bg-[linear-gradient(180deg,#ffffff,#f7f9ff)] p-6 shadow-[0_20px_42px_rgba(18,31,69,0.08)] ${className}`}
    >
      <div className="flex items-start gap-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#273c75,#1e3799)] text-sm font-bold text-white">
          {member.display_order}
        </div>
        <div className="relative h-[5.5rem] w-[5.5rem] shrink-0 overflow-hidden rounded-full border-4 border-white shadow-[0_14px_30px_rgba(18,31,69,0.14)] md:h-[6rem] md:w-[6rem]">
          {photoSrc ? (
            <img
              src={photoSrc}
              alt={member.name}
              className="h-full w-full object-cover object-[center_18%]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#dbe7ff,#bccdf8)] text-sm font-semibold text-primary">
              {member.name.charAt(0)}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary-soft">
            {member.role}
          </p>
          <h2 className="mt-2 text-xl font-bold text-primary">{member.name}</h2>
          {member.note ? (
            <p className="mt-2 text-sm leading-6 text-muted">{member.note}</p>
          ) : null}
        </div>
      </div>
      <div className="mt-5 rounded-[1.25rem] border border-line bg-white/78 p-4">
        <div className="space-y-2">
          <ContactLine label="Phone" value={member.phone} href={`tel:${member.phone}`} />
          <ContactLine label="Email" value={member.email} href={`mailto:${member.email}`} />
        </div>
      </div>
    </article>
  );
}

export default function MemberPage() {
  const [records, setRecords] = useState<MemberRecord[]>([]);
  const [currentTerm, setCurrentTerm] = useState<MemberTermRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let isCancelled = false;

    const loadMembers = async () => {
      try {
        setLoadError("");
        const [termResponse, memberResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/member-terms/current/`, { cache: "no-store" }),
          fetch(`${API_BASE_URL}/members/`, { cache: "no-store" }),
        ]);

        if (!termResponse.ok || !memberResponse.ok) {
          throw new Error("Unable to load committee records.");
        }

        const termData = (await termResponse.json()) as Partial<MemberTermRecord>;
        const data = (await memberResponse.json()) as MemberRecord[];
        if (!isCancelled) {
          setCurrentTerm(termData?.id ? normalizeMemberTermRecord(termData) : null);
          setRecords(sortMembers(data.map(normalizeMemberRecord).filter((item) => item.is_active)));
        }
      } catch (error) {
        if (!isCancelled) {
          setRecords([]);
          setLoadError(
            error instanceof Error ? error.message : "Unable to load committee records.",
          );
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    void loadMembers();
    return () => {
      isCancelled = true;
    };
  }, []);

  const leadershipMembers = useMemo(
    () => records.filter((member) => member.category === "leadership"),
    [records],
  );
  const committeeMembers = useMemo(
    () => records.filter((member) => member.category === "executive"),
    [records],
  );
  const advisoryMembers = useMemo(
    () => records.filter((member) => member.category === "advisory"),
    [records],
  );

  const president =
    leadershipMembers.find((member) => member.role.toLowerCase() === "president") ??
    leadershipMembers[0] ??
    null;

  const leadershipDisplayOrder = {
    "Past President": 1,
    "Founding President": 2,
    "Immediate Past President": 3,
  } as const;

  const leadershipRow = leadershipMembers
    .filter((member) =>
      ["Past President", "Founding President", "Immediate Past President"].includes(member.role),
    )
    .sort(
      (left, right) =>
        leadershipDisplayOrder[left.role as keyof typeof leadershipDisplayOrder] -
        leadershipDisplayOrder[right.role as keyof typeof leadershipDisplayOrder],
    );

  const officeBearers = leadershipMembers.filter(
    (member) =>
      member.id !== president?.id &&
      !["Past President", "Founding President", "Immediate Past President"].includes(member.role),
  );

  const officeBearerRows = chunkMembers(officeBearers, 3);
  const committeeRows = chunkMembers(committeeMembers, 3);
  const advisoryRows = chunkMembers(advisoryMembers, 3);

  return (
    <div className="section-wrap py-8 md:py-12">
      <section className="overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#16213f,#273c75)] px-6 py-12 text-white md:px-10">
        <SectionHeading
          eyebrow="Official Roster"
          title={currentTerm ? currentTerm.label : "Khichapokhari Newroad Business Association Working Committee"}
          description="The current leadership, executive committee, and advisory panel are published directly from the portal-managed term roster."
          light
        />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-[1.2rem] border border-white/14 bg-white/10 p-5 backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/72">
              Leadership
            </p>
            <p className="mt-3 text-2xl font-bold text-white">{leadershipMembers.length}</p>
          </div>
          <div className="rounded-[1.2rem] border border-white/14 bg-white/10 p-5 backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/72">
              Executive Committee
            </p>
            <p className="mt-3 text-2xl font-bold text-white">{committeeMembers.length}</p>
          </div>
          <div className="rounded-[1.2rem] border border-white/14 bg-white/10 p-5 backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/72">
              Total Listed Members
            </p>
            <p className="mt-3 text-2xl font-bold text-white">{records.length}</p>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="py-16 text-sm text-muted">Loading committee records...</div>
      ) : null}
      {!loading && loadError ? (
        <div className="py-16">
          <div className="rounded-[1.2rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {loadError}
          </div>
        </div>
      ) : null}

      {!loading && !loadError ? (
        <>
          <section className="py-16">
            <div className="rounded-[1.8rem] border border-line bg-[linear-gradient(135deg,#eef3ff,#ffffff)] px-6 py-7 shadow-[0_18px_40px_rgba(18,31,69,0.08)] md:px-8">
              <p className="text-sm font-semibold uppercase tracking-[0.26em] text-primary-soft">
                Leadership Tree
              </p>
              <h2 className="display-font mt-3 text-[1.75rem] font-semibold leading-tight text-primary md:text-[2.1rem]">
                Structured committee hierarchy for the current roster
              </h2>
            </div>

            {president ? (
              <div className="mt-10 grid gap-6 xl:grid-cols-3">
                <MemberCard member={president} className="xl:col-start-2" />
              </div>
            ) : null}

            {leadershipRow.length ? (
              <div className="mt-8 grid gap-6 xl:grid-cols-3">
                {leadershipRow.map((member) => (
                  <MemberCard key={member.id ?? member.email} member={member} />
                ))}
              </div>
            ) : null}

            <div className="mt-8 space-y-6">
              {officeBearerRows.map((row, rowIndex) => (
                <div key={rowIndex} className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {row.map((member, index) => (
                    <MemberCard
                      key={member.id ?? member.email}
                      member={member}
                      className={row.length === 1 && index === 0 ? "xl:col-start-2" : ""}
                    />
                  ))}
                </div>
              ))}
            </div>
          </section>

          <section className="py-6">
            <div className="rounded-[1.8rem] border border-line bg-[linear-gradient(135deg,#eef3ff,#ffffff)] px-6 py-7 text-center shadow-[0_18px_40px_rgba(18,31,69,0.08)] md:px-8">
              <p className="text-sm font-semibold uppercase tracking-[0.26em] text-primary-soft">
                Committee Members
              </p>
              <h2 className="display-font mt-3 text-[1.75rem] font-semibold leading-tight text-primary md:text-[2.1rem]">
                Executive committee members
              </h2>
            </div>
            <div className="mt-10 space-y-6">
              {committeeRows.map((row, rowIndex) => (
                <div key={rowIndex} className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {row.map((member, index) => (
                    <MemberCard
                      key={member.id ?? member.email}
                      member={member}
                      className={row.length === 1 && index === 0 ? "xl:col-start-2" : ""}
                    />
                  ))}
                </div>
              ))}
            </div>
          </section>

          <section className="py-16">
            <div className="rounded-[1.8rem] border border-line bg-[linear-gradient(135deg,#eef3ff,#ffffff)] px-6 py-7 text-center shadow-[0_18px_40px_rgba(18,31,69,0.08)] md:px-8">
              <p className="text-sm font-semibold uppercase tracking-[0.26em] text-primary-soft">
                Advisors
              </p>
              <h2 className="display-font mt-3 text-[1.75rem] font-semibold leading-tight text-primary md:text-[2.1rem]">
                Advisory and legal advisory panel
              </h2>
            </div>
            <div className="mt-10 space-y-6">
              {advisoryRows.map((row, rowIndex) => (
                <div key={rowIndex} className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {row.map((member, index) => (
                    <MemberCard
                      key={member.id ?? member.email}
                      member={member}
                      className={row.length === 1 && index === 0 ? "xl:col-start-2" : ""}
                    />
                  ))}
                </div>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
