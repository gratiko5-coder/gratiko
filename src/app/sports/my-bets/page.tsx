"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/i18n";
import { ArrowLeft, Ticket, Clock, CheckCircle, XCircle } from "lucide-react";

interface SportBetItem {
  id: string;
  betTicketNumber: string;
  leagueName: string;
  homeTeam: string;
  awayTeam: string;
  selectedLabel: string;
  odds: number;
  stakeCents: number;
  potentialWinCents: number;
  status: string;
  createdAt: string;
}

export default function MyBetsPage() {
  const [bets, setBets] = useState<SportBetItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBets = async () => {
      try {
        const res = await fetch("/api/sports/my-bets");
        if (res.ok) {
          const data = await res.json();
          setBets(data.bets || []);
        }
      } catch (err) {
        console.error("Erreur chargement paris:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBets();
  }, []);

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-6 px-4 pb-24">
      <div className="flex items-center justify-between">
        <Link
          href="/sports"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Retour aux paris
        </Link>
        <span className="text-xs text-amber-400 font-bold">Historique officiel</span>
      </div>

      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
          <Ticket className="w-7 h-7 text-amber-400" /> Mes Paris Sportifs
        </h1>
        <p className="text-xs text-gray-400">
          Suivi en temps réel de vos coupons de paris, cotes et gains potentiels.
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-gray-500">
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs">Chargement de vos paris...</p>
        </div>
      ) : bets.length === 0 ? (
        <div className="p-10 rounded-2xl bg-gray-900 border border-gray-800 text-center space-y-3">
          <Ticket className="w-10 h-10 text-gray-600 mx-auto" />
          <p className="text-sm text-gray-300 font-medium">Vous n'avez placé aucun pari sportif pour le moment.</p>
          <Link
            href="/sports"
            className="inline-block px-5 py-2.5 bg-amber-500 text-gray-950 font-bold rounded-xl text-xs hover:bg-amber-400 transition-colors"
          >
            Placer mon premier pari
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {bets.map((b) => (
            <div
              key={b.id}
              className="p-4 rounded-2xl bg-gray-900 border border-gray-800 space-y-3 hover:border-gray-700 transition-all"
            >
              <div className="flex justify-between items-center text-xs">
                <span className="font-mono text-gray-400">N° {b.betTicketNumber}</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                    b.status === "WON"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : b.status === "LOST"
                      ? "bg-red-500/20 text-red-400 border border-red-500/30"
                      : "bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1"
                  }`}
                >
                  {b.status === "WON" ? (
                    "GAGNÉ"
                  ) : b.status === "LOST" ? (
                    "PERDU"
                  ) : (
                    <>
                      <Clock className="w-3 h-3" />
                      EN COURS
                    </>
                  )}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-amber-400 font-bold uppercase">{b.leagueName}</span>
                <h4 className="font-bold text-white text-base">
                  {b.homeTeam} vs {b.awayTeam}
                </h4>
                <p className="text-xs text-gray-300 mt-1">
                  Sélection : <strong>{b.selectedLabel}</strong> • Cote :{" "}
                  <strong className="text-amber-400 font-mono">{b.odds.toFixed(2)}</strong>
                </p>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-gray-800 text-xs">
                <span className="text-gray-400">
                  Mise : <strong className="text-white">{formatCurrency(b.stakeCents, "HTG", "fr")}</strong>
                </span>
                <span className="text-gray-300">
                  Gain potentiel :{" "}
                  <strong className="text-amber-400 font-mono text-sm">
                    {formatCurrency(b.potentialWinCents, "HTG", "fr")}
                  </strong>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
