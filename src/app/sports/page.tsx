"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/i18n";
import { triggerWalletSync, subscribeWalletSync } from "@/lib/wallet-sync";
import { Trophy, Clock, CheckCircle2, ShieldCheck, Flame, X, ArrowRight, AlertCircle } from "lucide-react";
import { MatchOdds } from "@/lib/sports";

export default function SportsBettingPage() {
  const [matches, setMatches] = useState<MatchOdds[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeague, setSelectedLeague] = useState<string>("ALL");
  const [balanceCents, setBalanceCents] = useState<number>(0);

  // Coupon de pari (Bet Slip)
  const [activeSelection, setActiveSelection] = useState<{
    match: MatchOdds;
    outcome: "HOME" | "DRAW" | "AWAY";
    odds: number;
    label: string;
  } | null>(null);

  const [stakeAmount, setStakeAmount] = useState<number>(100); // 100 HTG
  const [placingBet, setPlacingBet] = useState(false);
  const [betSuccessMsg, setBetSuccessMsg] = useState<string | null>(null);
  const [betErrorMsg, setBetErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const res = await fetch("/api/wallet/balance", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (typeof data.balanceCents === "number") setBalanceCents(data.balanceCents);
        }
      } catch {}
    };

    const fetchMatches = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/sports/matches");
        if (res.ok) {
          const data = await res.json();
          setMatches(data.matches || []);
        }
      } catch (err) {
        console.error("Erreur chargement matchs:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
    fetchMatches();

    const unsub = subscribeWalletSync((bal) => {
      if (typeof bal === "number") setBalanceCents(bal);
      else fetchBalance();
    });

    return () => unsub();
  }, []);

  const handleSelectOutcome = (match: MatchOdds, outcome: "HOME" | "DRAW" | "AWAY") => {
    let odds = match.odds.home;
    let label = match.homeTeam;
    if (outcome === "DRAW") {
      odds = match.odds.draw;
      label = "Match Nul";
    } else if (outcome === "AWAY") {
      odds = match.odds.away;
      label = match.awayTeam;
    }

    if (activeSelection?.match.id === match.id && activeSelection?.outcome === outcome) {
      setActiveSelection(null);
    } else {
      setActiveSelection({ match, outcome, odds, label });
      setBetSuccessMsg(null);
      setBetErrorMsg(null);
    }
  };

  const handlePlaceBet = async () => {
    if (!activeSelection) return;
    const stakeCents = stakeAmount * 100;
    if (balanceCents < stakeCents) {
      setBetErrorMsg("Solde insuffisant dans votre portefeuille.");
      return;
    }

    setPlacingBet(true);
    setBetErrorMsg(null);
    setBetSuccessMsg(null);

    try {
      const res = await fetch("/api/sports/bet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId: activeSelection.match.id,
          selectedOutcome: activeSelection.outcome,
          stakeCents,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setBetErrorMsg(data.error || "Impossible de placer le pari.");
        triggerWalletSync();
      } else {
        setBetSuccessMsg(`Pari validé avec succès ! Ticket N° ${data.bet.betTicketNumber}`);
        triggerWalletSync(data.newBalanceCents);
        setTimeout(() => {
          setActiveSelection(null);
          setBetSuccessMsg(null);
        }, 3500);
      }
    } catch {
      setBetErrorMsg("Erreur réseau");
    } finally {
      setPlacingBet(false);
    }
  };

  const leagues = Array.from(new Set(matches.map((m) => m.leagueName)));
  const filteredMatches =
    selectedLeague === "ALL" ? matches : matches.filter((m) => m.leagueName === selectedLeague);

  const potentialWinCents = activeSelection
    ? Math.round(stakeAmount * 100 * activeSelection.odds)
    : 0;

  return (
    <div className="max-w-7xl mx-auto py-6 space-y-6 px-3 sm:px-6 pb-24">
      {/* En-tête Paris Sportifs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold text-amber-400 tracking-wider">
              OFFICIEL THE ODDS API
            </span>
            <span className="text-[10px] bg-red-600/80 text-white font-bold px-2 py-0.5 rounded-full animate-pulse">
              LIVE & 1X2
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
            <Trophy className="w-7 h-7 text-amber-400" /> Paris Sportifs (Paryaj GRATIKO)
          </h1>
          <p className="text-xs text-gray-400">
            Cotes en direct officielles européennes & internationales • Mises en Gourdes (HTG)
          </p>
        </div>

        <Link
          href="/sports/my-bets"
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-xl text-xs font-bold text-amber-400 transition-colors w-fit"
        >
          <span>Consulter mes paris</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Filtres de Ligues */}
      <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedLeague("ALL")}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            selectedLeague === "ALL"
              ? "bg-amber-500 text-gray-950 shadow-md"
              : "bg-gray-900 text-gray-400 hover:text-white border border-gray-800"
          }`}
        >
          Tous les Matchs ({matches.length})
        </button>
        {leagues.map((lg) => (
          <button
            key={lg}
            onClick={() => setSelectedLeague(lg)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedLeague === lg
                ? "bg-amber-500 text-gray-950 shadow-md"
                : "bg-gray-900 text-gray-400 hover:text-white border border-gray-800"
            }`}
          >
            {lg} ({matches.filter((m) => m.leagueName === lg).length})
          </button>
        ))}
      </div>

      {/* Grille Principale (Matchs + Coupon de pari) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne Gauche / Centre : Liste des Matchs */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="p-12 text-center text-gray-500 space-y-2">
              <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs">Chargement des cotes officielles en direct...</p>
            </div>
          ) : filteredMatches.length === 0 ? (
            <div className="p-8 text-center text-gray-500 bg-gray-900/50 rounded-2xl border border-gray-800">
              Aucun match disponible pour cette sélection actuellement.
            </div>
          ) : (
            filteredMatches.map((m) => {
              const date = new Date(m.commenceTime);
              const isSelectedHome = activeSelection?.match.id === m.id && activeSelection?.outcome === "HOME";
              const isSelectedDraw = activeSelection?.match.id === m.id && activeSelection?.outcome === "DRAW";
              const isSelectedAway = activeSelection?.match.id === m.id && activeSelection?.outcome === "AWAY";

              return (
                <div
                  key={m.id}
                  className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-gray-900/90 to-gray-950 border border-gray-800 hover:border-amber-500/30 transition-all space-y-3 shadow-lg"
                >
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-md border border-amber-500/20">
                      {m.leagueName}
                    </span>
                    <span className="text-gray-400 font-mono flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {date.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}{" "}
                      • {date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>

                  {/* Noms des Équipes */}
                  <div className="flex items-center justify-between py-1">
                    <span className="font-black text-white text-base sm:text-lg">{m.homeTeam}</span>
                    <span className="text-xs font-bold text-gray-500 px-2">VS</span>
                    <span className="font-black text-white text-base sm:text-lg text-right">{m.awayTeam}</span>
                  </div>

                  {/* Boutons Cotes 1X2 */}
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <button
                      onClick={() => handleSelectOutcome(m, "HOME")}
                      className={`py-2 px-3 rounded-xl border flex flex-col items-center justify-center transition-all ${
                        isSelectedHome
                          ? "bg-amber-500 text-gray-950 font-black border-amber-400 shadow-md scale-102"
                          : "bg-gray-800/80 hover:bg-gray-800 text-gray-200 border-gray-700"
                      }`}
                    >
                      <span className="text-[10px] uppercase font-bold opacity-75">1 (Domicile)</span>
                      <span className="text-sm font-black font-mono">{m.odds.home.toFixed(2)}</span>
                    </button>

                    <button
                      onClick={() => handleSelectOutcome(m, "DRAW")}
                      className={`py-2 px-3 rounded-xl border flex flex-col items-center justify-center transition-all ${
                        isSelectedDraw
                          ? "bg-amber-500 text-gray-950 font-black border-amber-400 shadow-md scale-102"
                          : "bg-gray-800/80 hover:bg-gray-800 text-gray-200 border-gray-700"
                      }`}
                    >
                      <span className="text-[10px] uppercase font-bold opacity-75">Nul</span>
                      <span className="text-sm font-black font-mono">{m.odds.draw.toFixed(2)}</span>
                    </button>

                    <button
                      onClick={() => handleSelectOutcome(m, "AWAY")}
                      className={`py-2 px-3 rounded-xl border flex flex-col items-center justify-center transition-all ${
                        isSelectedAway
                          ? "bg-amber-500 text-gray-950 font-black border-amber-400 shadow-md scale-102"
                          : "bg-gray-800/80 hover:bg-gray-800 text-gray-200 border-gray-700"
                      }`}
                    >
                      <span className="text-[10px] uppercase font-bold opacity-75">2 (Extérieur)</span>
                      <span className="text-sm font-black font-mono">{m.odds.away.toFixed(2)}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Colonne Droite : Coupon de Pari (Bet Slip) */}
        <div className="lg:col-span-1">
          <div className="sticky top-20 bg-gray-900 border border-amber-500/40 rounded-3xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <h3 className="font-black text-white text-base">Coupon de Pari</h3>
              </div>
              <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                {activeSelection ? "1 sélection" : "Vide"}
              </span>
            </div>

            {activeSelection ? (
              <div className="space-y-4">
                <div className="p-3 bg-gray-950 rounded-2xl border border-gray-800 space-y-2 relative">
                  <button
                    onClick={() => setActiveSelection(null)}
                    className="absolute top-2 right-2 text-gray-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="pr-6">
                    <span className="text-[10px] text-amber-400 font-bold uppercase">
                      {activeSelection.match.leagueName}
                    </span>
                    <p className="text-xs font-bold text-white">
                      {activeSelection.match.homeTeam} vs {activeSelection.match.awayTeam}
                    </p>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-gray-850 text-xs">
                    <span className="text-gray-300">
                      Choix : <strong>{activeSelection.label}</strong>
                    </span>
                    <span className="font-mono font-black text-amber-400 text-sm">
                      {activeSelection.odds.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Saisie de la Mise */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-gray-400 font-semibold">
                    <span>Mise en Gourdes :</span>
                    <span className="text-white font-mono">{stakeAmount} HTG</span>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5">
                    {[50, 100, 250, 500].map((amt) => (
                      <button
                        key={amt}
                        onClick={() => setStakeAmount(amt)}
                        className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                          stakeAmount === amt
                            ? "bg-amber-500 text-gray-950 font-black shadow"
                            : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                        }`}
                      >
                        {amt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Résumé Gain Potentiel */}
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-1">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Total Cote :</span>
                    <span className="font-mono font-bold text-white">{activeSelection.odds.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-black pt-1 border-t border-amber-500/20">
                    <span className="text-amber-300">Gain Potentiel :</span>
                    <span className="text-amber-400 font-mono text-base">
                      {formatCurrency(potentialWinCents, "HTG", "fr")}
                    </span>
                  </div>
                </div>

                {betErrorMsg && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{betErrorMsg}</span>
                  </div>
                )}

                {betSuccessMsg && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{betSuccessMsg}</span>
                  </div>
                )}

                <button
                  disabled={placingBet}
                  onClick={handlePlaceBet}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 font-black rounded-xl text-sm shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                >
                  {placingBet ? "Validation du pari..." : "Placer le Pari Immédiat"}
                </button>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500 space-y-2">
                <Trophy className="w-8 h-8 text-gray-600 mx-auto" />
                <p className="text-xs">
                  Cliquez sur une cote (1, Nul ou 2) pour l'ajouter à votre coupon.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
