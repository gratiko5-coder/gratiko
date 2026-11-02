"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/i18n";
import { ArrowLeft, Ticket, Clock, CheckCircle2, XCircle, Layers, Calendar, Trophy } from "lucide-react";
import { BetSelectionDetail } from "@/lib/sports";

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
  betType: string;
  selectionsJson?: string | null;
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
    <div className="max-w-4xl mx-auto py-6 space-y-6 px-4 pb-28">
      <div className="flex items-center justify-between">
        <Link
          href="/sports"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Retour aux paris
        </Link>
        <span className="text-xs text-amber-400 font-bold bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
          Historique officiel
        </span>
      </div>

      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
          <Ticket className="w-7 h-7 text-amber-400" /> Mes Fiches de Paris
        </h1>
        <p className="text-xs text-gray-400">
          Suivi en temps réel de vos coupons simples et combinés (Paryaj Lakay style)
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-gray-500">
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs">Chargement de vos fiches de paris...</p>
        </div>
      ) : bets.length === 0 ? (
        <div className="p-10 rounded-2xl bg-gray-900 border border-gray-800 text-center space-y-3">
          <Ticket className="w-10 h-10 text-gray-600 mx-auto" />
          <p className="text-sm text-gray-300 font-medium">Vous n'avez placé aucun pari sportif pour le moment.</p>
          <Link
            href="/sports"
            className="inline-block px-5 py-2.5 bg-amber-500 text-gray-950 font-bold rounded-xl text-xs hover:bg-amber-400 transition-colors shadow"
          >
            Placer mon premier pari
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bets.map((b) => {
            let selections: BetSelectionDetail[] = [];
            if (b.selectionsJson) {
              try {
                selections = JSON.parse(b.selectionsJson);
              } catch {}
            }

            const isMultiple = b.betType === "MULTIPLE" || selections.length > 1;
            const date = new Date(b.createdAt);

            return (
              <div
                key={b.id}
                className="p-4 sm:p-5 rounded-2xl bg-gray-900 border border-gray-800 space-y-3.5 hover:border-gray-700 transition-all shadow-lg"
              >
                {/* Header Ticket */}
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-gray-400 font-bold">N° {b.betTicketNumber}</span>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${
                        isMultiple
                          ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                          : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                      }`}
                    >
                      {isMultiple ? `COMBINÉ (${selections.length || "MULTI"})` : "PARI SIMPLE"}
                    </span>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                      b.status === "WON"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1"
                        : b.status === "LOST"
                        ? "bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1"
                        : "bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1"
                    }`}
                  >
                    {b.status === "WON" ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" /> GAGNÉ
                      </>
                    ) : b.status === "LOST" ? (
                      <>
                        <XCircle className="w-3.5 h-3.5" /> PERDU
                      </>
                    ) : (
                      <>
                        <Clock className="w-3.5 h-3.5" /> EN COURS
                      </>
                    )}
                  </span>
                </div>

                {/* Détail des Sélections */}
                {selections.length > 0 ? (
                  <div className="space-y-2 bg-gray-950/70 p-3 rounded-xl border border-gray-850">
                    <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-amber-400" /> Sélections incluses :
                    </div>
                    {selections.map((s, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center text-xs py-1.5 border-b border-gray-850/60 last:border-0"
                      >
                        <div>
                          <span className="text-[10px] text-amber-400 font-semibold">{s.leagueName}</span>
                          <p className="font-bold text-white text-xs">
                            {s.homeTeam} vs {s.awayTeam}
                          </p>
                          <p className="text-[11px] text-gray-400">
                            Pari : <strong className="text-amber-300">{s.selectedLabel}</strong>
                          </p>
                        </div>
                        <span className="font-mono font-black text-amber-400 text-sm">
                          {s.odds.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
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
                )}

                {/* Footer Ticket Financier */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-3 border-t border-gray-800 text-xs gap-2">
                  <div className="flex items-center gap-4">
                    <span className="text-gray-400">
                      Mise : <strong className="text-white">{formatCurrency(b.stakeCents, "HTG", "fr")}</strong>
                    </span>
                    <span className="text-gray-400">
                      Cote finale : <strong className="text-amber-400 font-mono">{b.odds.toFixed(2)}</strong>
                    </span>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3">
                    <span className="text-gray-300">
                      Gain potentiel :{" "}
                      <strong className="text-emerald-400 font-mono text-sm font-black">
                        {formatCurrency(b.potentialWinCents, "HTG", "fr")}
                      </strong>
                    </span>
                  </div>
                </div>

                <div className="text-[10px] text-gray-500 font-mono flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {date.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "long", year: "numeric" })}{" "}
                  à {date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
