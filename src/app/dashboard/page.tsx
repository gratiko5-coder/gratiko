import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDictionary, Locale, formatCurrency } from "@/lib/i18n";
import {
  Wallet,
  Ticket,
  ArrowUpRight,
  ArrowDownLeft,
  Sparkles,
  Trophy,
  History,
  CheckCircle,
  Clock,
} from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login");
  }

  // Redirection des administrateurs vers la console d'administration
  if (user.role !== "PLAYER") {
    redirect("/admin");
  }

  const cookieStore = await cookies();
  const locale = (cookieStore.get("NEXT_LOCALE")?.value as Locale) || "fr";
  const t = getDictionary(locale);

  // Tickets de l'utilisateur
  const tickets = await prisma.ticket.findMany({
    where: { userId: user.id },
    include: { ticketType: true },
    orderBy: { purchasedAt: "desc" },
    take: 10,
  });

  // Somme des gains remportés
  const totalWinnings = await prisma.ticket.aggregate({
    _sum: { prizeAmountCents: true },
    where: { userId: user.id, isWinner: true, status: "CLAIMED" },
  });

  const totalWonCents = totalWinnings._sum.prizeAmountCents || 0;

  // Tickets prêts à gratter
  const pendingTickets = tickets.filter((t) => t.status === "PURCHASED");
  const completedTickets = tickets.filter((t) => t.status === "CLAIMED" || t.status === "SCRATCHED");

  return (
    <div className="space-y-8 py-6">
      {/* Salutations et En-tête */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-bold text-amber-400 tracking-wider">
            {t.common.dashboard}
          </span>
          <h1 className="text-3xl font-black text-white">Bon retour, {user.fullName} !</h1>
          <p className="text-xs text-gray-400 font-mono">
            {user.email} • ID: {user.id.slice(-8)}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/tickets"
            className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 font-black rounded-xl shadow-lg transition-all flex items-center gap-2 text-sm"
          >
            <Ticket className="w-4 h-4 text-gray-950" />
            {t.dashboard.buyTicketBtn}
          </Link>
        </div>
      </div>

      {/* Cartes Portefeuille & Statistiques Financières */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Solde disponible */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-950/80 to-gray-900 border border-indigo-500/30 space-y-2 shadow-xl">
          <div className="flex justify-between items-center text-gray-400 text-xs font-semibold">
            <span>{t.dashboard.availableBalance}</span>
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            {formatCurrency(user.wallet?.balanceCents || 0, user.currency, locale)}
          </div>
          <div className="pt-2 flex gap-2">
            <Link
              href="/wallet"
              className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1"
            >
              <ArrowDownLeft className="w-3.5 h-3.5" /> Recharger
            </Link>
            <span className="text-gray-700">•</span>
            <Link
              href="/wallet"
              className="text-xs font-bold text-gray-300 hover:text-white flex items-center gap-1"
            >
              <ArrowUpRight className="w-3.5 h-3.5" /> Retirer
            </Link>
          </div>
        </div>

        {/* Total Gains Remportés */}
        <div className="p-6 rounded-3xl bg-gray-900/80 border border-gray-800 space-y-2 shadow-xl">
          <div className="flex justify-between items-center text-gray-400 text-xs font-semibold">
            <span>{t.dashboard.totalWinnings}</span>
            <Trophy className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-400">
            {formatCurrency(totalWonCents, user.currency, locale)}
          </div>
          <p className="text-[11px] text-gray-400 pt-2">Tous crédités directement</p>
        </div>

        {/* Recharges en attente de vérification */}
        <div className="p-6 rounded-3xl bg-gray-900/80 border border-gray-800 space-y-2 shadow-xl">
          <div className="flex justify-between items-center text-gray-400 text-xs font-semibold">
            <span>{t.dashboard.pendingDeposits}</span>
            <Clock className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-indigo-300">
            {formatCurrency(user.wallet?.pendingInCents || 0, user.currency, locale)}
          </div>
          <p className="text-[11px] text-gray-400 pt-2">En cours de validation agent</p>
        </div>

        {/* Retraits en cours de traitement */}
        <div className="p-6 rounded-3xl bg-gray-900/80 border border-gray-800 space-y-2 shadow-xl">
          <div className="flex justify-between items-center text-gray-400 text-xs font-semibold">
            <span>{t.dashboard.pendingWithdrawals}</span>
            <ArrowUpRight className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-orange-300">
            {formatCurrency(user.wallet?.pendingOutCents || 0, user.currency, locale)}
          </div>
          <p className="text-[11px] text-gray-400 pt-2">Fonds verrouillés en cours de virement</p>
        </div>
      </div>

      {/* Tickets prêts à gratter (Actifs) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            Tickets prêts à gratter ({pendingTickets.length})
          </h2>
        </div>

        {pendingTickets.length === 0 ? (
          <div className="p-8 rounded-3xl bg-gray-900/40 border border-gray-800/80 text-center space-y-3">
            <Ticket className="w-10 h-10 text-gray-600 mx-auto" />
            <p className="text-sm text-gray-400">Vous n'avez aucun ticket en attente de grattage.</p>
            <Link
              href="/tickets"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-colors"
            >
              Choisir un ticket
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingTickets.map((tkt) => (
              <div
                key={tkt.id}
                className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950 to-gray-900 border border-amber-500/30 flex flex-col justify-between shadow-xl space-y-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-amber-400">À gratter</span>
                    <h3 className="text-lg font-black text-white">{tkt.ticketType.name}</h3>
                    <p className="text-[11px] text-gray-400 font-mono">{tkt.ticketNumber}</p>
                  </div>
                  <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 rounded-lg text-xs font-black">
                    {formatCurrency(tkt.priceCents, tkt.currency, locale)}
                  </span>
                </div>

                <Link
                  href={`/tickets/${tkt.id}`}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 font-black rounded-xl text-center text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  {t.tickets.scratchNow}
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Historique des tickets grattés */}
      <div className="space-y-4">
        <h2 className="text-xl font-black text-white flex items-center gap-2">
          <History className="w-5 h-5 text-gray-400" />
          Derniers tickets joués
        </h2>

        {completedTickets.length === 0 ? (
          <div className="p-6 rounded-2xl bg-gray-900/30 border border-gray-800 text-center text-xs text-gray-500">
            Aucun historique de tickets pour le moment.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gray-800">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-gray-900/80 text-gray-400 uppercase font-semibold border-b border-gray-800">
                <tr>
                  <th className="px-4 py-3">Ticket</th>
                  <th className="px-4 py-3">N° Série</th>
                  <th className="px-4 py-3">Date d'achat</th>
                  <th className="px-4 py-3">Prix</th>
                  <th className="px-4 py-3">Résultat</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 bg-gray-950/40">
                {completedTickets.map((tkt) => (
                  <tr key={tkt.id} className="hover:bg-gray-900/30 transition-colors">
                    <td className="px-4 py-3 font-bold text-white">{tkt.ticketType.name}</td>
                    <td className="px-4 py-3 font-mono text-gray-400">{tkt.ticketNumber}</td>
                    <td className="px-4 py-3 text-gray-400">
                      {new Date(tkt.purchasedAt).toLocaleDateString(locale === "ht" ? "fr-HT" : "fr-FR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-300">
                      {formatCurrency(tkt.priceCents, tkt.currency, locale)}
                    </td>
                    <td className="px-4 py-3">
                      {tkt.isWinner ? (
                        <span className="inline-flex items-center gap-1 font-bold text-amber-400">
                          <CheckCircle className="w-3.5 h-3.5 text-amber-400" />
                          Gagné (+{formatCurrency(tkt.prizeAmountCents, tkt.currency, locale)})
                        </span>
                      ) : (
                        <span className="text-gray-500">Non gagnant</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/tickets/${tkt.id}`}
                        className="text-indigo-400 hover:text-indigo-300 font-semibold"
                      >
                        Revoir
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
