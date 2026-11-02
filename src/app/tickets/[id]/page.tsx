import React from "react";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDictionary, Locale } from "@/lib/i18n";
import ScratchCard from "@/components/ScratchCard";
import { ArrowLeft, Ticket, ShieldCheck } from "lucide-react";

export default async function ScratchTicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login");
  }

  const cookieStore = await cookies();
  const locale = (cookieStore.get("NEXT_LOCALE")?.value as Locale) || "fr";
  const t = getDictionary(locale);

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: { ticketType: true },
  });

  if (!ticket) {
    notFound();
  }

  // Contrôle de sécurité: l'utilisateur doit être le propriétaire du ticket
  if (ticket.userId !== user.id && user.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-6">
      {/* Navigation retour */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.common.back} au tableau de bord
        </Link>
        <div className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Résultat scellé sur serveur</span>
        </div>
      </div>

      {/* Carte de Grattage Interactive */}
      <ScratchCard
        ticket={{
          id: ticket.id,
          ticketNumber: ticket.ticketNumber,
          priceCents: ticket.priceCents,
          currency: ticket.currency,
          isWinner: ticket.isWinner,
          prizeAmountCents: ticket.prizeAmountCents,
          tierName: ticket.tierName,
          symbolsPattern: ticket.symbolsPattern,
          status: ticket.status,
          ticketType: {
            name: ticket.ticketType.name,
            visualTheme: ticket.ticketType.visualTheme,
            rulesText: ticket.ticketType.rulesText,
          },
        }}
        t={t}
        locale={locale}
      />

      {/* Boutons d'action supplémentaires */}
      <div className="flex flex-col sm:flex-row justify-center gap-3 pt-4">
        <Link
          href="/tickets"
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors shadow"
        >
          <Ticket className="w-4 h-4" />
          Acheter un autre ticket
        </Link>
        <Link
          href="/dashboard"
          className="px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-gray-300 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors border border-gray-800"
        >
          Voir mon portefeuille
        </Link>
      </div>
    </div>
  );
}
