import type { Metadata } from "next";
import { Providers } from "./providers"; // ← Import the provider
import "./globals.css";

export const metadata: Metadata = {
  title: "DSA Coach",
  description: "AI-powered DSA interview prep",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers> {/* ← Wrap with Providers */}
      </body>
    </html>
  );
}