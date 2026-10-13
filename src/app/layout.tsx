import type { Metadata } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import { Shell } from "../components/shell";
import "./globals.css";

const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "ACME Paybook",
  description: "Salary records and pay questions for ACME HR.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${sans.className}`}>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
