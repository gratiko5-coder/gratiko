import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DemoBanner from "@/components/DemoBanner";
import { getCurrentUser } from "@/lib/auth";
import { getDictionary, Locale } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "GRATIKO — Plateforme de Tickets Virtuels à Gratter",
  description: "Plateforme moderne, sécurisée et transparente de tickets à gratter et jeux instantanés.",
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
      <body className="bg-gray-950 text-gray-100 flex flex-col min-h-screen antialiased selection:bg-amber-500 selection:text-gray-950">
        <DemoBanner notice={t.common.demoNotice} />
        <Header user={user} t={t} currentLocale={localeCookie} />
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
        <Footer t={t} />
      </body>
    </html>
  );
}
