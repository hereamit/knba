export const siteNavItems = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Member", href: "/member" },
  { label: "Services", href: "/services" },
  { label: "Gallery", href: "/gallery" },
  { label: "Contact", href: "/contact" },
];

export const emergencyNotice = {
  label: "Emergency Notice",
  message:
    "For urgent market coordination, safety concerns, or service disruption updates, contact the KNBA secretariat immediately.",
  contact: "+977-1-5350000",
};

export type HeroSlide = {
  eyebrow: string;
  title: string;
  shortTitle: string;
  description: string;
  feature: string;
  image: string;
  credit: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
};

export const heroSlides: HeroSlide[] = [
  {
    eyebrow: "Khichapokhari Market Leadership",
    title: "A stronger New Road business community starts with coordinated action.",
    shortTitle: "Market Advocacy",
    description:
      "KNBA represents merchants, strengthens collaboration, and creates a more organized business environment for the Khichapokhari and New Road corridor.",
    feature: "Collective representation for businesses, events, and market coordination.",
    image: "/hero/new-road-1.jpg",
    credit: "Photo: S Pakhrin / Wikimedia Commons",
    primaryLabel: "About KNBA",
    primaryHref: "/about",
    secondaryLabel: "Our Services",
    secondaryHref: "/services",
  },
  {
    eyebrow: "Programs & Events",
    title: "From orientation sessions to festivals, the association keeps members connected.",
    shortTitle: "Events & Programs",
    description:
      "The website highlights events, gallery updates, and practical support services that keep the business community informed and engaged.",
    feature: "Training, networking, celebration, and issue resolution under one platform.",
    image: "/hero/new-road-gate.jpg",
    credit: "Photo: Vyacheslav Argenberg / Wikimedia Commons",
    primaryLabel: "View Gallery",
    primaryHref: "/gallery",
    secondaryLabel: "Contact Office",
    secondaryHref: "/contact",
  },
  {
    eyebrow: "Future-Ready Operations",
    title: "A digital presence that reflects the energy and credibility of the organization.",
    shortTitle: "Digital Presence",
    description:
      "This platform is designed to present KNBA professionally to members, visitors, and partners while preparing the frontend for Django REST-based administration.",
    feature: "Clear communication, modern UI, and an admin workflow for faster updates.",
    image: "/hero/asan-market.jpg",
    credit: "Photo: McKay Savage / Wikimedia Commons",
    primaryLabel: "Contact KNBA",
    primaryHref: "/contact",
    secondaryLabel: "Admin Portal",
    secondaryHref: "/login",
  },
];

export const homeStats = [
  {
    value: "325+",
    label: "Businesses Connected",
    detail: "A growing network of retailers, wholesalers, and service providers in the New Road market area.",
  },
  {
    value: "20+",
    label: "Years Of Coordination",
    detail: "Longstanding local advocacy and business support across one of Kathmandu’s busiest trading districts.",
  },
  {
    value: "12",
    label: "Annual Programs",
    detail: "Meetings, awareness campaigns, skill sessions, and celebration activities organized for members.",
  },
  {
    value: "24/7",
    label: "Community Commitment",
    detail: "Continuous collaboration with stakeholders to improve business continuity, safety, and communication.",
  },
];

export const siteHistory =
  "Khichapokhari Newroad Business Association was established by business leaders and market stakeholders who recognized the need for an organized voice in one of Kathmandu’s busiest commercial zones. Over the years, the association has helped coordinate traders, represent collective concerns, and support local business operations through communication, advocacy, and community engagement.";

export const presidentMessage =
  "The current leadership is focused on modernizing association services, improving communication with members, and building stronger coordination with local authorities so that businesses can operate with greater confidence, efficiency, and shared purpose.";

export const organizationPrinciples = [
  {
    label: "Mission",
    title: "Support every member business with practical coordination and representation.",
    description:
      "KNBA aims to make business operations easier by offering a reliable platform for communication, issue handling, training, and partnership building.",
    points: [
      "Protect collective business interests through organized advocacy",
      "Encourage knowledge sharing, collaboration, and member participation",
      "Promote a clean, safe, and active commercial environment",
    ],
  },
  {
    label: "Vision",
    title: "Create a well-managed, trusted, and future-ready business district.",
    description:
      "The association envisions a market community where businesses grow with confidence, public engagement is strong, and New Road remains a model commercial destination.",
    points: [
      "Strengthen market identity and stakeholder relationships",
      "Enable better use of digital tools and modern business systems",
      "Build long-term resilience for members and the local economy",
    ],
  },
];

export const milestones = [
  {
    year: "1998",
    title: "Association Formation",
    description:
      "Business leaders formally organized a platform to represent shared market needs and improve coordination.",
  },
  {
    year: "2007",
    title: "Member Expansion",
    description:
      "KNBA widened participation across traders, retail stores, and service-oriented enterprises in the area.",
  },
  {
    year: "2016",
    title: "Program Diversification",
    description:
      "The association added awareness programs, local events, and more structured business support initiatives.",
  },
  {
    year: "2025",
    title: "Digital Transformation",
    description:
      "KNBA began preparing digital systems for communication, content updates, and structured administration.",
  },
];

export const serviceHighlights = [
  {
    tag: "Representation",
    title: "Business Advocacy & Liaison",
    description:
      "KNBA can represent member concerns with local government, ward offices, utilities, and market stakeholders.",
    points: [
      "Coordinate collective issues related to trade operations and public services",
      "Support dialogue with authorities on market safety, traffic, or access concerns",
      "Provide a formal channel for association notices and position statements",
    ],
  },
  {
    tag: "Operations",
    title: "Member Coordination & Support Desk",
    description:
      "The association can operate as a support desk for documentation guidance, issue routing, and member communication.",
    points: [
      "Maintain member records and renewal reminders",
      "Route inquiries and complaints to the right authority or internal committee",
      "Share circulars, notices, and urgent updates with businesses efficiently",
    ],
  },
  {
    tag: "Capacity Building",
    title: "Training, Awareness & Networking",
    description:
      "KNBA can help local businesses adapt through workshops, awareness campaigns, and community-led knowledge sharing.",
    points: [
      "Organize training on business compliance, digital payments, and customer service",
      "Run networking sessions and peer learning for merchants",
      "Promote seasonal campaigns, festivals, and market activation events",
    ],
  },
];

export const supportSteps = [
  {
    title: "Receive Member Request",
    description:
      "Log the issue, inquiry, or support request and assign it to the appropriate desk or committee.",
  },
  {
    title: "Coordinate Response",
    description:
      "Communicate with concerned stakeholders, gather updates, and define next actions clearly.",
  },
  {
    title: "Follow Up",
    description:
      "Keep the member informed with response status, deadlines, and any documents or visits required.",
  },
  {
    title: "Close & Report",
    description:
      "Mark the case resolved, record outcomes, and include it in performance reporting for the association.",
  },
];

export type GalleryItem = {
  src: string;
  title: string;
  category: string;
  description: string;
};

export const galleryItems: GalleryItem[] = [
  {
    src: "/hero/new-road-1.jpg",
    title: "Market Coordination Meeting",
    category: "Meetings",
    description:
      "Association leaders and member businesses reviewing market operations, shared concerns, and upcoming activities.",
  },
  {
    src: "/hero/asan-market.jpg",
    title: "Community Outreach Program",
    category: "Community",
    description:
      "A collaborative outreach initiative focused on improving coordination, cleanliness, and neighborhood engagement.",
  },
  {
    src: "/photos/kathmandu-market.jpg",
    title: "Business Capacity Workshop",
    category: "Training",
    description:
      "Training session for members on practical business topics, service quality, and digital adaptation.",
  },
  {
    src: "/hero/new-road-gate.jpg",
    title: "Festival Street Illumination",
    category: "Events",
    description:
      "Seasonal decorations and collective preparations that strengthen the festive market atmosphere in New Road.",
  },
  {
    src: "/photos/asan-tole.jpg",
    title: "Stakeholder Partnership Session",
    category: "Meetings",
    description:
      "Discussion with external stakeholders and local authorities to improve business services and market facilities.",
  },
  {
    src: "/photos/new-road-2.jpg",
    title: "New Road Heritage Walk",
    category: "Community",
    description:
      "An activity that connects commerce, local culture, and neighborhood identity through guided participation.",
  },
];

export const gallerySummary = [
  { label: "Featured Albums", value: "06" },
  { label: "Photo Categories", value: "04" },
  { label: "Interactive Lightbox", value: "Enabled" },
];

export const contactDetails = [
  {
    label: "Address",
    value: "Khichapokhari, New Road, Kathmandu",
    note: "Located in the main commercial corridor near the New Road market area.",
  },
  {
    label: "Phone",
    value: "+977-1-5350000",
    note: "Call during office hours for membership assistance and general coordination.",
  },
  {
    label: "Email",
    value: "secretariat@knba.org.np",
    note: "Use email for formal requests, partnerships, and documentation inquiries.",
  },
];

export const footerSocialLinks = [
  { label: "Facebook", href: "https://facebook.com" },
  { label: "LinkedIn", href: "https://linkedin.com" },
  { label: "YouTube", href: "https://youtube.com" },
];

export const officeHours = [
  { label: "Sunday - Friday", value: "10:00 AM - 5:00 PM" },
  { label: "Saturday", value: "Closed" },
  { label: "Public Holidays", value: "Closed or by notice" },
];

export type MemberProfile = {
  name: string;
  role: string;
  phone: string;
  email: string;
  photo: string;
};

export const executiveMembers: MemberProfile[] = [
  {
    name: "Ramesh Shrestha",
    role: "President",
    phone: "+977-9801000101",
    email: "president@knba.org.np",
    photo: "/people/president.jpg",
  },
  {
    name: "Sushil Tuladhar",
    role: "Vice-President",
    phone: "+977-9801000102",
    email: "vicepresident@knba.org.np",
    photo: "/people/vice-president.jpg",
  },
  {
    name: "Anita Maharjan",
    role: "Secretariat",
    phone: "+977-9801000103",
    email: "secretariat@knba.org.np",
    photo: "/people/secretariat.jpg",
  },
];

export const advisoryMembers: MemberProfile[] = [
  {
    name: "Prakash Manandhar",
    role: "Advisory Board",
    phone: "+977-9801000201",
    email: "prakash@knba.org.np",
    photo: "/people/advisory-1.jpg",
  },
  {
    name: "Bina Kansakar",
    role: "Advisory Board",
    phone: "+977-9801000202",
    email: "bina@knba.org.np",
    photo: "/people/advisory-2.jpg",
  },
  {
    name: "Sanjeev Rajbhandari",
    role: "Advisory Board",
    phone: "+977-9801000203",
    email: "sanjeev@knba.org.np",
    photo: "/people/advisory-3.jpg",
  },
];

export const committeeMembers: MemberProfile[] = [
  {
    name: "Nabin Shakya",
    role: "Executive Member",
    phone: "+977-9801000301",
    email: "nabin@knba.org.np",
    photo: "/people/member-1.jpg",
  },
  {
    name: "Pramila Joshi",
    role: "Executive Member",
    phone: "+977-9801000302",
    email: "pramila@knba.org.np",
    photo: "/people/member-2.jpg",
  },
  {
    name: "Deepak Shrestha",
    role: "Executive Member",
    phone: "+977-9801000303",
    email: "deepak@knba.org.np",
    photo: "/people/member-3.jpg",
  },
  {
    name: "Sarita Bajracharya",
    role: "Executive Member",
    phone: "+977-9801000304",
    email: "sarita@knba.org.np",
    photo: "/people/member-4.jpg",
  },
  {
    name: "Milan Tuladhar",
    role: "Executive Member",
    phone: "+977-9801000305",
    email: "milan@knba.org.np",
    photo: "/people/member-5.jpg",
  },
  {
    name: "Rita Maharjan",
    role: "Executive Member",
    phone: "+977-9801000306",
    email: "rita@knba.org.np",
    photo: "/people/member-6.jpg",
  },
];

export const adminNavItems = [
  { label: "Dashboard", href: "/admin", icon: "◫" },
  { label: "Members", href: "/admin/members", icon: "◎" },
  { label: "Events", href: "/admin/events", icon: "◉" },
  { label: "Gallery", href: "/admin/gallery", icon: "▣" },
  { label: "Messages", href: "/admin/messages", icon: "✉" },
  { label: "Settings", href: "/admin/settings", icon: "⚙" },
];

export const adminMetricCards = [
  {
    label: "Active Members",
    value: "325",
    delta: "+12 this month",
    description: "Member count with current renewals and verified business details.",
    barClass: "bg-[#1e3799]",
    badgeClass: "",
  },
  {
    label: "Open Issues",
    value: "18",
    delta: "6 urgent",
    description: "Pending operational concerns awaiting follow-up or stakeholder response.",
    barClass: "bg-[#eb2f06]",
    badgeClass: "",
  },
  {
    label: "Events Scheduled",
    value: "06",
    delta: "2 this week",
    description: "Upcoming meetings, training sessions, and community programs in progress.",
    barClass: "bg-emerald-500",
    badgeClass: "",
  },
  {
    label: "Gallery Assets",
    value: "240",
    delta: "+34 uploaded",
    description: "Photos and media ready for curation and website publication.",
    barClass: "bg-amber-400",
    badgeClass: "",
  },
];

export const adminQuickStats = [
  { month: "Jan", value: 38, color: "bg-[#273c75]" },
  { month: "Feb", value: 52, color: "bg-[#1e3799]" },
  { month: "Mar", value: 61, color: "bg-[#273c75]" },
  { month: "Apr", value: 48, color: "bg-[#eb2f06]" },
  { month: "May", value: 72, color: "bg-[#1e3799]" },
  { month: "Jun", value: 84, color: "bg-[#273c75]" },
];

export const adminTasks = [
  {
    title: "Approve three pending membership renewals",
    status: "Pending",
    description:
      "Review submitted records, verify contact information, and update membership validity for the next cycle.",
  },
  {
    title: "Publish Holi market coordination notice",
    status: "In progress",
    description:
      "Finalize public advisory content and push it to the website after leadership approval.",
  },
  {
    title: "Respond to partnership inquiry",
    status: "Needs reply",
    description:
      "Prepare a follow-up email and meeting schedule for a local banking partner seeking collaboration.",
  },
];

export const adminActivity = [
  {
    time: "09:10 AM",
    action: "New contact inquiry received from merchant support form",
    owner: "Secretariat Desk",
    status: "Unread",
  },
  {
    time: "10:00 AM",
    action: "Gallery album updated with training event photos",
    owner: "Media Admin",
    status: "Published",
  },
  {
    time: "11:45 AM",
    action: "Member renewal record reviewed and approved",
    owner: "Admin Officer",
    status: "Completed",
  },
  {
    time: "01:15 PM",
    action: "Upcoming event schedule sent for leadership review",
    owner: "Program Team",
    status: "Waiting",
  },
];

export const memberRows = [
  {
    business: "Newroad Traders Hub",
    category: "Wholesale",
    renewal: "Valid until Dec 2026",
    contact: "+977-9801000001",
  },
  {
    business: "Khichapokhari Fashion Point",
    category: "Retail",
    renewal: "Renewal due in 18 days",
    contact: "+977-9801000002",
  },
  {
    business: "Metro Mobile Solutions",
    category: "Electronics",
    renewal: "Valid until Aug 2026",
    contact: "+977-9801000003",
  },
  {
    business: "Heritage Stationers",
    category: "Supplies",
    renewal: "Documents under review",
    contact: "+977-9801000004",
  },
];

export const eventRows = [
  {
    title: "Retail Digitization Orientation",
    date: "18 Mar 2026",
    venue: "KNBA Hall",
    status: "Open",
    description:
      "Orientation for member businesses on digital billing, payment tools, and customer data handling.",
  },
  {
    title: "Festival Coordination Meeting",
    date: "25 Mar 2026",
    venue: "New Road Market Corridor",
    status: "Planning",
    description:
      "Joint planning with local stakeholders around crowd management, signage, and festive operations.",
  },
  {
    title: "Member Networking Evening",
    date: "03 Apr 2026",
    venue: "Community Venue",
    status: "Confirmed",
    description:
      "An association-led evening focused on partnerships, referrals, and member introductions.",
  },
];

export const messageRows = [
  {
    name: "Sanjay Shrestha",
    email: "sanjay@example.com",
    topic: "Membership Support",
    date: "10 Mar 2026",
    message:
      "I would like to renew our business membership and confirm the required documentation for this year.",
  },
  {
    name: "Pratima Maharjan",
    email: "pratima@example.com",
    topic: "Partnership",
    date: "09 Mar 2026",
    message:
      "Our organization is interested in collaborating with KNBA on a small business awareness program in New Road.",
  },
  {
    name: "Rajan Tuladhar",
    email: "rajan@example.com",
    topic: "Event Inquiry",
    date: "08 Mar 2026",
    message:
      "Please share upcoming training and networking event details for merchants in the Khichapokhari area.",
  },
];

export const settingsCards = [
  {
    title: "Website Content Workflow",
    status: "Draft ready",
    description:
      "Define approval roles for pages, gallery updates, event posts, and emergency notices before connecting the CMS or API.",
  },
  {
    title: "Authentication Integration",
    status: "Pending backend",
    description:
      "Connect the login form and route protection to Django REST authentication, token issuance, and role checks.",
  },
  {
    title: "Contact Information",
    status: "Live content",
    description:
      "Keep office address, phone, email, and map reference synchronized across the public site and admin configuration.",
  },
  {
    title: "Media Storage Policy",
    status: "Needs review",
    description:
      "Choose how uploaded gallery assets will be validated, stored, and served once the backend is added.",
  },
];
