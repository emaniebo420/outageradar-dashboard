import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OutageRadar — Live vendor status",
  description: "Live status for the third-party tools your team depends on, checked automatically every 5 minutes.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
