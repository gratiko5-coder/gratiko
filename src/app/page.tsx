import React from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { getDictionary, Locale, formatCurrency } from "@/lib/i18n";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Shield, ArrowRight, CheckCircle2, Ticket, Trophy, Flame } from "lucide-react";

export default async function HomePage() {
  const cookieStore = await cookies();
  const locale = (cookieStore.get("NEXT_LOCALE")?.value as Locale) || "fr";
  const t = getDictionary(locale);
  const user = await getCurrentUser();

  const ticketTypes = await prisma.ticketType.findMany({
    where: { isActive: true },
    include: {
      batches: {
        where: { status: "ACTIVE" },
        include: { prizeTiers: true },
      },
    },
    orderBy: { priceCents: "asc" },
  });

  return (
    <div className="space-y-10 sm:space-y-16 py-3 sm:py-8 w-full max-w-full overflow-hidden">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-indigo-950 via-gray-900 to-black p-5 sm:p-8 md:p-14 border border-indigo-500/20 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 sm:w-96 h-72 sm:h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-72 sm:w-96 h-72 sm:h-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="relative max-w-3xl space-y-4 sm:space-y-6">
          <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] sm:text-xs font-bold uppercase tracking-wider">
            <span>Lancement Caraïbes & International</span>
          </div>

          <h1 className="text-2xl sm:text-5xl md:text-6xl font-black tracking-tight text-white leading-tight break-words">
            Grattez en direct. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-indigo-400">
              Gagnez instantanément.
            </span>
          </h1>

          <p className="text-sm sm:text-lg text-gray-300 leading-relaxed max-w-2xl break-words">
            {t.common.tagline}. Une expérience fluide sur mobile, des résultats scellés par cryptographie côté serveur et un portefeuille transparent.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2 sm:pt-4">
            <Link
              href="/tickets"
              className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 font-black rounded-xl sm:rounded-2xl shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <Ticket className="w-4 h-4 sm:w-5 sm:h-5 text-gray-950 shrink-0" />
              <span>{t.dashboard.buyTicketBtn}</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </Link>

            {user ? (
              <Link
                href="/dashboard"
                className="w-full sm:w-auto px-6 py-3.5 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl sm:rounded-2xl border border-gray-700 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                {t.common.dashboard}
              </Link>
            ) : (
              <Link
                href="/auth/register"
                className="w-full sm:w-auto px-6 py-3.5 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl sm:rounded-2xl border border-gray-700 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                {t.auth.registerButton}
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Catalogue en vedette */}
      <section className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2">
          <div>
            <h2 className="text-xl sm:text-3xl font-black text-white">{t.tickets.catalogTitle}</h2>
            <p className="text-xs sm:text-sm text-gray-400">{t.tickets.catalogSubtitle}</p>
          </div>
          <Link href="/tickets" className="text-amber-400 hover:text-amber-300 text-xs sm:text-sm font-semibold flex items-center gap-1">
            Voir toute la sélection <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {ticketTypes.map((type) => {
            const baseMaxPrizeCents = type.batches[0]?.prizeTiers.reduce(
              (max, tier) => Math.max(max, tier.prizeAmountCents),
              0
            ) || (type.priceCents * 30);

            // Bonus de cagnotte évolutive : 40% de l'allocation jeu (32% du prix du ticket) s'accumule sur chaque mise
            const ticketsSold = type.batches[0]?.ticketsSold || 0;
            const progressiveBonusCents = Math.round(ticketsSold * type.priceCents * 0.32);
            const effectiveMaxCents = baseMaxPrizeCents + progressiveBonusCents;

            return (
              <div
                key={type.id}
                className="rounded-2xl sm:rounded-3xl bg-gray-900/70 border border-gray-800 hover:border-amber-500/50 p-4 sm:p-6 flex flex-col justify-between transition-all hover:scale-[1.01] shadow-xl group"
              >
                <div className="space-y-4">
                  {/* Bannière Montant Maximum Haute Visibilité */}
                  <div className="flex flex-col gap-1.5 w-full">
                    <div className="flex items-center justify-between bg-gradient-to-r from-amber-500/20 via-amber-400/15 to-amber-500/10 border-2 border-amber-500/50 rounded-2xl px-3.5 py-2 shadow-md">
                      <div className="flex items-center gap-1.5">
                        <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
                        <span className="text-[11px] sm:text-xs font-bold text-gray-300 uppercase tracking-wider">Max :</span>
                      </div>
                      <span className="text-base sm:text-lg font-black text-amber-300 font-mono tracking-tight drop-shadow">
                        {formatCurrency(effectiveMaxCents, type.currency, locale)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold px-1">
                      <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0 fill-amber-400" />
                      <span>Super Jackpot en direct</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg sm:text-xl font-black text-white">{type.name}</h3>
                    <p className="text-xs text-gray-400 mt-1 sm:mt-2 line-clamp-2 leading-relaxed">
                      {type.description}
                    </p>
                  </div>
                </div>

                <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-800/80 space-y-3">
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-xs font-semibold text-gray-400">Prix du ticket :</span>
                    <span className="text-base sm:text-lg font-black text-amber-400 font-mono">
                      {formatCurrency(type.priceCents, type.currency, locale)}
                    </span>
                  </div>
                  <Link
                    href={`/tickets?type=${type.id}`}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-sm transition-colors shadow-lg"
                  >
                    {t.tickets.buyNow}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Piliers de Sécurité & Transparence (Sans jargon comptable interne) */}
      <section className="rounded-2xl sm:rounded-3xl bg-gray-900/40 border border-gray-800 p-5 sm:p-8 md:p-12 space-y-6 sm:space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-xl sm:text-2xl font-black text-white">Pourquoi GRATIKO est unique</h2>
          <p className="text-xs sm:text-sm text-gray-400">
            Une architecture conçue selon les plus hauts standards de transparence et de sécurité informatique.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div className="p-5 sm:p-6 rounded-2xl bg-gray-950/60 border border-gray-800 space-y-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-white">Résultats Scellés Côté Serveur</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Le résultat est tiré par cryptographie côté serveur dès l'achat. L'animation visuelle de grattage n'altère en aucun cas l'issue scellée.
            </p>
          </div>

          <div className="p-5 sm:p-6 rounded-2xl bg-gray-950/60 border border-gray-800 space-y-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-white">Multilingue & International</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Conçu d'origine en créole haïtien et en français, adaptable immédiatement pour les Caraïbes et l'Afrique.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
