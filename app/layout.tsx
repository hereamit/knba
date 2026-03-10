import type { Metadata } from "next";
import "./globals.css";

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
      <body>{children}</body>
    </html>
  );
}
