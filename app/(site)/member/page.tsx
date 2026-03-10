import Image from "next/image";
import { SectionHeading } from "@/components/section-heading";
import {
  advisoryMembers,
  committeeMembers,
  executiveMembers,
  type MemberProfile,
} from "@/lib/site-data";

function ProfileCard({ member }: { member: MemberProfile }) {
  return (
    <article className="panel rounded-[1.7rem] bg-[linear-gradient(180deg,#ffffff,#f7f9ff)] p-6 shadow-[0_20px_42px_rgba(18,31,69,0.08)] transition-transform duration-200 hover:-translate-y-1">
      <div className="flex items-start gap-4">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-4 border-white shadow-[0_10px_24px_rgba(18,31,69,0.14)]">
          <Image src={member.photo} alt={member.name} fill className="object-cover" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary-soft">
            {member.role}
          </p>
          <h2 className="mt-2 text-xl font-bold text-primary">{member.name}</h2>
        </div>
      </div>
      <div className="mt-5 rounded-[1.2rem] border border-line bg-white/70 p-4 text-sm leading-7 text-muted">
        <p>
          <span className="font-semibold text-primary">Phone:</span>{" "}
          <a href={`tel:${member.phone}`}>{member.phone}</a>
        </p>
        <p className="mt-2 break-words">
          <span className="font-semibold text-primary">Email:</span>{" "}
          <a href={`mailto:${member.email}`}>{member.email}</a>
        </p>
      </div>
    </article>
  );
}

export default function MemberPage() {
  return (
    <div className="section-wrap py-8 md:py-12">
      <section className="overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#16213f,#273c75)] px-6 py-12 text-white md:px-10">
        <SectionHeading
          eyebrow="Member Directory"
          title="Leadership and committee members of KNBA."
          description="This page presents the core office bearers, advisory group, and executive members of the association with their contact details for organizational communication and coordination."
          light
        />
      </section>

      <section className="py-16">
        <SectionHeading
          eyebrow="Office Bearers"
          title="President, Vice-President, and Secretariat"
          description="The executive office bearers coordinate the association's daily leadership, public representation, and member service workflow."
        />
        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {executiveMembers.map((member) => (
            <ProfileCard key={member.email} member={member} />
          ))}
        </div>
      </section>

      <section className="py-4">
        <SectionHeading
          eyebrow="Advisory"
          title="Advisory board members"
          description="The advisory board provides strategic guidance, institutional memory, and support for long-term association decisions."
        />
        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {advisoryMembers.map((member) => (
            <ProfileCard key={member.email} member={member} />
          ))}
        </div>
      </section>

      <section className="py-16">
        <SectionHeading
          eyebrow="Committee Members"
          title="Executive members and support team"
          description="Committee members help the association maintain outreach, event management, merchant coordination, and issue handling across the New Road business community."
        />
        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {committeeMembers.map((member) => (
            <ProfileCard key={member.email} member={member} />
          ))}
        </div>
      </section>
    </div>
  );
}
