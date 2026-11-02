import React from "react";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDictionary, Locale } from "@/lib/i18n";
import TicketCatalogList from "@/components/TicketCatalogList";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function TicketsPage() {
  const user = await getCurrentUser();
  const cookieStore = await cookies();
  const locale = (cookieStore.get("NEXT_LOCALE")?.value as Locale) || "fr";
  const t = getDictionary(locale);

  const ticketTypes = await prisma.ticketType.findMany({
    where: { isActive: true },
    include: {
      batches: {
        where: { status: "ACTIVE" },
        include: {
          prizeTiers: true,
        },
      },
    },
    orderBy: { priceCents: "asc" },
  });

  return (
    <div className="space-y-8 py-6">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="text-xs uppercase font-bold text-amber-400 tracking-wider">
          {t.common.appName} SÉLECTION OFFICIELLE
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-white">{t.tickets.catalogTitle}</h1>
        <p className="text-xs sm:text-sm text-gray-400">{t.tickets.catalogSubtitle}</p>
      </div>

      <TicketCatalogList
        ticketTypes={ticketTypes}
        userBalanceCents={user?.wallet?.balanceCents || 0}
        isLoggedIn={!!user}
        t={t}
        locale={locale}
      />
    </div>
  );
}
