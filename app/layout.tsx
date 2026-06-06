import type { Metadata } from "next";
import { Bodoni_Moda, Manrope } from "next/font/google";
import { AdminEditProvider } from "@/components/admin/admin-edit-context";
import { SmoothScroll } from "@/components/site/smooth-scroll";
import { fetchLiveSeoMetadata, fetchLiveSiteContent } from "@/lib/firebase/server-seo";
import "./globals.css";

const display = Bodoni_Moda({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display"
});

const sans = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans"
});

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return fetchLiveSeoMetadata();
}

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialContent = await fetchLiveSiteContent();

  return (
    <html lang="pl" className={`${display.variable} ${sans.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <SmoothScroll />
        <AdminEditProvider initialContent={initialContent}>
          <div className="cinematicAtmosphere" aria-hidden="true" />
          <div className="film-grain" aria-hidden="true" />
          {children}
        </AdminEditProvider>
      </body>
    </html>
  );
}
