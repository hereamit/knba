import { presidentMessage as fallbackPresidentMessage, siteHistory } from "@/lib/site-data";

export type SiteSettingsRecord = {
  organization_name: string;
  short_name: string;
  office_address: string;
  office_phone: string;
  office_email: string;
  history_text: string;
  founder_name: string;
  founder_title: string;
  founder_message: string;
  founder_image_url: string;
  president_name: string;
  president_title: string;
  president_message: string;
  president_image_url: string;
  mission_text: string;
  vision_text: string;
  map_embed_url: string;
  home_about_eyebrow: string;
  home_about_title: string;
  home_services_eyebrow: string;
  home_services_title: string;
  home_services_description: string;
  home_business_eyebrow: string;
  home_business_title: string;
  home_business_description: string;
  home_gallery_eyebrow: string;
  home_gallery_title: string;
  home_gallery_description: string;
};

export const defaultSiteSettings: SiteSettingsRecord = {
  organization_name: "Khichapokhari Newroad Business Association",
  short_name: "KNBA",
  office_address: "Khichapokhari, New Road, Kathmandu",
  office_phone: "+977-1-5350000",
  office_email: "secretariat@knba.org.np",
  history_text: siteHistory,
  founder_name: "Hari Krishna Tuladhar",
  founder_title: "Founder Chair",
  founder_message:
    "Our market has always relied on trust, cooperation, and quick coordination. KNBA was created so businesses could solve common issues together and move forward with a united voice.",
  founder_image_url: "/people/president.jpg",
  president_name: "Ramesh Shrestha",
  president_title: "Current President",
  president_message: fallbackPresidentMessage,
  president_image_url: "/people/president.jpg",
  mission_text:
    "Support every member business with practical coordination, representation, and easier access to information.",
  vision_text:
    "Create a well-managed, trusted, and future-ready business district in Khichapokhari and New Road.",
  map_embed_url:
    "https://www.google.com/maps?q=Khichapokhari%20New%20Road%20Kathmandu&output=embed",
  home_about_eyebrow: "About KNBA",
  home_about_title:
    "KNBA builds a unified business voice for Khichapokhari and New Road.",
  home_services_eyebrow: "Core Services",
  home_services_title: "Practical support that makes day-to-day business easier.",
  home_services_description:
    "These service cards now come from the live KNBA service records managed in the portal.",
  home_business_eyebrow: "Business Showcase",
  home_business_title: "Promoted businesses that help support KNBA operations.",
  home_business_description:
    "This sponsored directory gives member businesses a stronger public presence while creating a practical fundraising stream for the association.",
  home_gallery_eyebrow: "Gallery",
  home_gallery_title:
    "Moments from events, market coordination, and member programs.",
  home_gallery_description:
    "A snapshot of KNBA activities across meetings, celebrations, training sessions, and collaboration on New Road.",
};

function pickSettingText(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

export function normalizeSiteSettingsRecord(
  record: Partial<SiteSettingsRecord>,
): SiteSettingsRecord {
  return {
    organization_name:
      typeof record.organization_name === "string" && record.organization_name.trim()
        ? record.organization_name
        : defaultSiteSettings.organization_name,
    short_name:
      typeof record.short_name === "string" && record.short_name.trim()
        ? record.short_name
        : defaultSiteSettings.short_name,
    office_address:
      typeof record.office_address === "string" && record.office_address.trim()
        ? record.office_address
        : defaultSiteSettings.office_address,
    office_phone:
      typeof record.office_phone === "string" && record.office_phone.trim()
        ? record.office_phone
        : defaultSiteSettings.office_phone,
    office_email:
      typeof record.office_email === "string" && record.office_email.trim()
        ? record.office_email
        : defaultSiteSettings.office_email,
    history_text:
      typeof record.history_text === "string" && record.history_text.trim()
        ? record.history_text
        : defaultSiteSettings.history_text,
    founder_name:
      typeof (record as { founder_name?: string }).founder_name === "string" &&
      (record as { founder_name?: string }).founder_name?.trim()
        ? (record as { founder_name: string }).founder_name
        : defaultSiteSettings.founder_name,
    founder_title:
      typeof (record as { founder_title?: string }).founder_title === "string" &&
      (record as { founder_title?: string }).founder_title?.trim()
        ? (record as { founder_title: string }).founder_title
        : defaultSiteSettings.founder_title,
    founder_message:
      typeof record.founder_message === "string" && record.founder_message.trim()
        ? record.founder_message
        : defaultSiteSettings.founder_message,
    founder_image_url:
      typeof (record as { founder_image_url?: string }).founder_image_url === "string" &&
      (record as { founder_image_url?: string }).founder_image_url?.trim()
        ? (record as { founder_image_url: string }).founder_image_url
        : defaultSiteSettings.founder_image_url,
    president_name:
      typeof (record as { president_name?: string }).president_name === "string" &&
      (record as { president_name?: string }).president_name?.trim()
        ? (record as { president_name: string }).president_name
        : defaultSiteSettings.president_name,
    president_title:
      typeof (record as { president_title?: string }).president_title === "string" &&
      (record as { president_title?: string }).president_title?.trim()
        ? (record as { president_title: string }).president_title
        : defaultSiteSettings.president_title,
    president_message:
      typeof record.president_message === "string" && record.president_message.trim()
        ? record.president_message
        : defaultSiteSettings.president_message,
    president_image_url:
      typeof (record as { president_image_url?: string }).president_image_url === "string" &&
      (record as { president_image_url?: string }).president_image_url?.trim()
        ? (record as { president_image_url: string }).president_image_url
        : defaultSiteSettings.president_image_url,
    mission_text:
      typeof record.mission_text === "string" && record.mission_text.trim()
        ? record.mission_text
        : defaultSiteSettings.mission_text,
    vision_text:
      typeof record.vision_text === "string" && record.vision_text.trim()
        ? record.vision_text
        : defaultSiteSettings.vision_text,
    map_embed_url:
      typeof record.map_embed_url === "string" && record.map_embed_url.trim()
        ? record.map_embed_url
        : defaultSiteSettings.map_embed_url,
    home_about_eyebrow: pickSettingText(
      record.home_about_eyebrow,
      defaultSiteSettings.home_about_eyebrow,
    ),
    home_about_title: pickSettingText(
      record.home_about_title,
      defaultSiteSettings.home_about_title,
    ),
    home_services_eyebrow: pickSettingText(
      record.home_services_eyebrow,
      defaultSiteSettings.home_services_eyebrow,
    ),
    home_services_title: pickSettingText(
      record.home_services_title,
      defaultSiteSettings.home_services_title,
    ),
    home_services_description: pickSettingText(
      record.home_services_description,
      defaultSiteSettings.home_services_description,
    ),
    home_business_eyebrow: pickSettingText(
      record.home_business_eyebrow,
      defaultSiteSettings.home_business_eyebrow,
    ),
    home_business_title: pickSettingText(
      record.home_business_title,
      defaultSiteSettings.home_business_title,
    ),
    home_business_description: pickSettingText(
      record.home_business_description,
      defaultSiteSettings.home_business_description,
    ),
    home_gallery_eyebrow: pickSettingText(
      record.home_gallery_eyebrow,
      defaultSiteSettings.home_gallery_eyebrow,
    ),
    home_gallery_title: pickSettingText(
      record.home_gallery_title,
      defaultSiteSettings.home_gallery_title,
    ),
    home_gallery_description: pickSettingText(
      record.home_gallery_description,
      defaultSiteSettings.home_gallery_description,
    ),
  };
}
