import type { Metadata } from "next";
import { Bodoni_Moda, Manrope } from "next/font/google";
import { AdminEditProvider } from "@/components/admin/admin-edit-context";
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

export const metadata: Metadata = {
  title: "Weronika Malik | Portfolio aktorskie",
  description: "Editorialowe, monochromatyczne portfolio aktorki Weroniki Malik."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl" className={`${display.variable} ${sans.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AdminEditProvider>
          <div className="film-grain" aria-hidden="true" />
          {children}
        </AdminEditProvider>
      </body>
    </html>
  );
}
