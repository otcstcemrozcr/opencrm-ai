import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OpenCRM AI",
  description: "AI-native Revenue Operations platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">{children}</body>
    </html>
  );
}
