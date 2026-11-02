import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DemoBanner from "@/components/DemoBanner";
import { getCurrentUser } from "@/lib/auth";
import { getDictionary, Locale } from "@/lib/i18n";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0b0f19",
};

export const metadata: Metadata = {
  title: "GRATIKO — Plateforme de Tickets Virtuels à Gratter",
  description: "Plateforme moderne, sécurisée et transparente de tickets à gratter et jeux instantanés.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "GRATIKO",
  },
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const localeCookie = (cookieStore.get("NEXT_LOCALE")?.value as Locale) || "fr";
  const user = await getCurrentUser();
  const t = getDictionary(localeCookie);

  return (
    <html lang={localeCookie} className="dark">
      <body className="bg-gray-950 text-gray-100 flex flex-col min-h-screen antialiased selection:bg-amber-500 selection:text-gray-950 overflow-x-hidden w-full max-w-full">
        {process.env.APP_MODE !== "PRODUCTION" && <DemoBanner notice={t.common.demoNotice} />}
        <Header user={user} t={t} currentLocale={localeCookie} />
        <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 overflow-x-hidden">
          {children}
        </main>
        <Footer t={t} />
      </body>
    </html>
  );
}
