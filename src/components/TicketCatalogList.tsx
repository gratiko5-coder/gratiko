"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency, Translations } from "@/lib/i18n";
import { Trophy, ShieldAlert, ArrowRight, Flame } from "lucide-react";
import { triggerWalletSync, subscribeWalletSync } from "@/lib/wallet-sync";

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
  const [currentBalance, setCurrentBalance] = useState<number>(userBalanceCents);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Synchroniser le solde en direct
  useEffect(() => {
    setCurrentBalance(userBalanceCents);
  }, [userBalanceCents]);

  useEffect(() => {
    if (!isLoggedIn) return;

    // Récupérer le solde réel au chargement de la page
    const fetchBalance = async () => {
      try {
        const res = await fetch("/api/wallet/balance", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (typeof data.balanceCents === "number") {
            setCurrentBalance(data.balanceCents);
            triggerWalletSync(data.balanceCents);
          }
        }
      } catch {
        // Ignorer
      }
    };

    fetchBalance();

    const unsubscribe = subscribeWalletSync((newBal) => {
      if (typeof newBal === "number") {
        setCurrentBalance(newBal);
      } else {
        fetchBalance();
      }
    });

    return () => unsubscribe();
  }, [isLoggedIn]);

  const handleBuy = async (ticketTypeId: string, priceCents: number) => {
    if (!isLoggedIn) {
      router.push("/auth/login");
      return;
    }

    if (currentBalance < priceCents) {
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
        // Si le solde était insuffisant côté serveur, rafraîchir immédiatement le solde
        triggerWalletSync();
        setBuyingId(null);
        return;
      }

      // Notifier immédiatement toute l'application du nouveau solde
      if (typeof data.newBalanceCents === "number") {
        triggerWalletSync(data.newBalanceCents);
      } else {
        triggerWalletSync();
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

          const ticketsSold = type.batches[0]?.ticketsSold || 0;
          const progressiveBonusCents = Math.round(ticketsSold * type.priceCents * 0.32);
          const effectiveMaxCents = baseMaxPrizeCents + progressiveBonusCents;

          const isBuying = buyingId === type.id;

          return (
            <div
              key={type.id}
              className="rounded-3xl bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950 border border-gray-800 hover:border-amber-500/50 p-5 sm:p-6 flex flex-col justify-between shadow-2xl transition-all hover:scale-[1.01] group relative overflow-hidden"
            >
              {/* Effet lumineux d'arrière plan */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

              <div className="space-y-4">
                {/* Bannière Montant Maximum Haute Visibilité */}
                <div className="flex flex-col gap-1.5 w-full">
                  <div className="flex items-center justify-between bg-gradient-to-r from-amber-500/25 via-amber-400/15 to-amber-500/10 border-2 border-amber-500/50 rounded-2xl px-3.5 py-2.5 shadow-md">
                    <div className="flex items-center gap-1.5">
                      <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="text-[11px] sm:text-xs font-bold text-gray-300 uppercase tracking-wider">Max :</span>
                    </div>
                    <span className="text-base sm:text-lg font-black text-amber-300 font-mono tracking-tight drop-shadow">
                      {formatCurrency(effectiveMaxCents, type.currency, locale)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-amber-400 font-bold px-1">
                    <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0 fill-amber-400" />
                    <span>Super Jackpot en direct</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-white">{type.name}</h3>
                  <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                    {type.description}
                  </p>
                </div>
              </div>

              {/* Pied de carte : Prix & Achat */}
              <div className="mt-6 pt-4 border-t border-gray-800/80 space-y-3">
                <div className="flex justify-between items-center py-1">
                  <span className="text-xs font-semibold text-gray-400">Prix du ticket :</span>
                  <span className="text-base sm:text-lg font-black text-amber-400 font-mono">
                    {formatCurrency(type.priceCents, type.currency, locale)}
                  </span>
                </div>

                <button
                  type="button"
                  disabled={isBuying}
                  onClick={() => handleBuy(type.id, type.priceCents)}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 font-black rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                >
                  {isBuying ? (
                    <span>Achat en cours...</span>
                  ) : (
                    <>
                      <span>{t.tickets.buyNow}</span>
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
