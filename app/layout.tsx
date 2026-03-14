import type { Metadata } from "next";
import { Merriweather, Source_Sans_3 } from "next/font/google";
import { OrganizationProfileProvider } from "@/components/organization-profile-provider";
import "./globals.css";

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source-sans",
});

const merriweather = Merriweather({
  subsets: ["latin"],
  variable: "--font-merriweather",
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "KNBA | Khichapokhari Newroad Business Association",
  description:
    "Official website for Khichapokhari Newroad Business Association in New Road, Kathmandu.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${sourceSans.variable} ${merriweather.variable}`}>
        <OrganizationProfileProvider>{children}</OrganizationProfileProvider>
      </body>
    </html>
  );
}
