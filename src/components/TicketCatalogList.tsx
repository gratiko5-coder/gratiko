"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency, Translations } from "@/lib/i18n";
import { Sparkles, Trophy, ShieldAlert, ArrowRight, TrendingUp } from "lucide-react";

interface TicketTypeItem {
  id: string;
  slug: string;
  name: string;
  description: string;
  priceCents: number;
  currency: string;
  rulesText: string;
  visualTheme: string;
  batches: {
    id: string;
    batchNumber: string;
    totalTickets: number;
    ticketsSold: number;
    prizeTiers: {
      tierName: string;
      prizeAmountCents: number;
      probability: number;
      displayLabel: string;
    }[];
  }[];
}

export default function TicketCatalogList({
  ticketTypes,
  userBalanceCents,
  isLoggedIn,
  t,
  locale,
}: {
  ticketTypes: TicketTypeItem[];
  userBalanceCents: number;
  isLoggedIn: boolean;
  t: Translations;
  locale: string;
}) {
  const router = useRouter();
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleBuy = async (ticketTypeId: string, priceCents: number) => {
    if (!isLoggedIn) {
      router.push("/auth/login");
      return;
    }

    if (userBalanceCents < priceCents) {
      setErrorMsg(t.tickets.insufficientFunds);
      return;
    }

    setBuyingId(ticketTypeId);
    setErrorMsg(null);

    try {
      // Clé d'idempotence unique par clic pour empêcher tout double débit
      const idempotencyKey = `BUY_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      const res = await fetch("/api/tickets/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketTypeId, idempotencyKey }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Erreur lors de l'achat.");
        setBuyingId(null);
        return;
      }

      // Rediriger vers l'interface de grattage du ticket acheté
      router.push(`/tickets/${data.ticket.id}`);
    } catch {
      setErrorMsg("Erreur réseau");
      setBuyingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {errorMsg && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={() => router.push("/wallet")}
            className="text-xs font-bold text-amber-400 underline ml-4 hover:text-amber-300"
          >
            Recharger mon portefeuille
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {ticketTypes.map((type) => {
          const baseMaxPrizeCents = type.batches[0]?.prizeTiers.reduce(
            (max, tier) => Math.max(max, tier.prizeAmountCents),
            0
          ) || type.priceCents * 30;

          // Bonus de cagnotte évolutive : 40% de l'allocation jeu (32% de chaque ticket vendu)
          const ticketsSold = type.batches[0]?.ticketsSold || 0;
          const progressiveBonusCents = Math.round(ticketsSold * type.priceCents * 0.32);
          const effectiveMaxCents = baseMaxPrizeCents + progressiveBonusCents;

          const isBuying = buyingId === type.id;

          return (
            <div
              key={type.id}
              className="rounded-3xl bg-gradient-to-b from-gray-900 to-gray-950 border border-gray-800 hover:border-amber-500/40 p-6 flex flex-col justify-between shadow-2xl transition-all hover:scale-[1.01] group relative overflow-hidden"
            >
              {/* Effet d'arrière plan */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

              <div className="space-y-4">
                {/* Bannière Montant Maximum Haute Visibilité */}
                <div className="flex flex-col gap-1.5 w-full">
                  <div className="flex items-center justify-between bg-gradient-to-r from-amber-500/20 via-amber-400/15 to-amber-500/10 border-2 border-amber-500/50 rounded-2xl px-3.5 py-2 shadow-md">
                    <div className="flex items-center gap-1.5">
                      <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">Max :</span>
                    </div>
                    <span className="text-base sm:text-lg font-black text-amber-300 font-mono tracking-tight drop-shadow">
                      {formatCurrency(effectiveMaxCents, type.currency, locale)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold px-1">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400 shrink-0 animate-pulse" />
                    <span>Jackpot Évolutif (+40% réserve)</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-white">{type.name}</h3>
                  <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
                    {type.description}
                  </p>
                </div>

                {/* Cagnotte Max Évolutive */}
                <div className="p-3 rounded-2xl bg-indigo-950/40 border border-indigo-500/20 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-amber-400" />
                      <span className="text-xs text-gray-300 font-semibold">{t.tickets.maxPrize}</span>
                    </div>
                    <span className="text-sm font-black text-amber-400">
                      {formatCurrency(effectiveMaxCents, type.currency, locale)}
                    </span>
                  </div>
                  <p className="text-[10px] text-emerald-400 font-medium">
                    📈 S'accumule en direct avec 40% de la part de réserve sur chaque mise.
                  </p>
                </div>

                {/* Tableau résumé des probabilités du lot actif */}
                <div className="pt-2">
                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                    {t.tickets.probabilitiesTitle}
                  </span>
                  <div className="mt-1 space-y-1 text-[11px] text-gray-400">
                    {type.batches[0]?.prizeTiers.map((tier, idx) => (
                      <div key={idx} className="flex justify-between items-center py-0.5 border-b border-gray-800/40">
                        <span className="text-gray-300">{tier.displayLabel}</span>
                        <span className="font-mono text-gray-400">
                          {(tier.probability * 100).toFixed(1)}% (1 sur {Math.round(1 / tier.probability)})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bouton d'achat protégé contre double clic */}
              <div className="mt-6 pt-4 border-t border-gray-800/80">
                <button
                  type="button"
                  disabled={isBuying}
                  onClick={() => handleBuy(type.id, type.priceCents)}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 font-black rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                >
                  {isBuying ? (
                    <span>Achat & Sécurisation en cours...</span>
                  ) : (
                    <>
                      <span>{t.tickets.buyNow} ({formatCurrency(type.priceCents, type.currency, locale)})</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
