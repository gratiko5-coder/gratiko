"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/i18n";
import { triggerWalletSync, subscribeWalletSync } from "@/lib/wallet-sync";
import {
  Trophy,
  Clock,
  CheckCircle2,
  Flame,
  X,
  ArrowRight,
  AlertCircle,
  Trash2,
  ShoppingCart,
  ChevronRight,
  Zap,
  TrendingUp,
  Search,
  Radio,
  SlidersHorizontal,
} from "lucide-react";
import { MatchOdds } from "@/lib/sports";

interface BetSelectionItem {
  match: MatchOdds;
  outcome: "HOME" | "DRAW" | "AWAY";
  odds: number;
  label: string;
}

export default function SportsBettingPage() {
  const [matches, setMatches] = useState<MatchOdds[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeague, setSelectedLeague] = useState<string>("ALL");
  const [balanceCents, setBalanceCents] = useState<number>(0);

  // Vue All vs Live (Modèle officiel Panels 4 & 5)
  const [viewMode, setViewMode] = useState<"ALL" | "LIVE">("ALL");
  const [selectedSport, setSelectedSport] = useState<string>("HOT");
  const [searchMatchQuery, setSearchMatchQuery] = useState<string>("");
  const [coeffSort, setCoeffSort] = useState<"NONE" | "ASC" | "DESC">("NONE");

  // Sélections multiples (Panier / Bet Slip combiné & simple)
  const [selections, setSelections] = useState<BetSelectionItem[]>([]);
  const [slipMode, setSlipMode] = useState<"SIMPLE" | "MULTIPLE">("MULTIPLE");
  const [stakeAmount, setStakeAmount] = useState<number>(50); // 50 HTG par défaut
  const [placingBet, setPlacingBet] = useState(false);
  const [betSuccessMsg, setBetSuccessMsg] = useState<string | null>(null);
  const [betErrorMsg, setBetErrorMsg] = useState<string | null>(null);

  // État du tiroir Panier sur mobile
  const [mobileSlipOpen, setMobileSlipOpen] = useState(false);

  useEffect(() => {
    // Vérifier si paramètre ?tab=live dans l'URL
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("tab") === "live") {
        setViewMode("LIVE");
      }
    }

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

  // Gestion de la sélection / désélection d'un résultat
  const handleToggleSelection = (match: MatchOdds, outcome: "HOME" | "DRAW" | "AWAY") => {
    let odds = match.odds.home;
    let label = match.homeTeam;
    if (outcome === "DRAW") {
      odds = match.odds.draw;
      label = "Match Nul";
    } else if (outcome === "AWAY") {
      odds = match.odds.away;
      label = match.awayTeam;
    }

    setBetSuccessMsg(null);
    setBetErrorMsg(null);

    setSelections((prev) => {
      const existingIndex = prev.findIndex((s) => s.match.id === match.id);

      if (existingIndex >= 0) {
        const existing = prev[existingIndex];
        // Si même issue -> retirer
        if (existing.outcome === outcome) {
          return prev.filter((_, idx) => idx !== existingIndex);
        }
        // Si issue différente sur le même match -> remplacer
        const updated = [...prev];
        updated[existingIndex] = { match, outcome, odds, label };
        return updated;
      }

      // Nouvelle sélection ajoutée au combiné
      return [...prev, { match, outcome, odds, label }];
    });
  };

  const handleRemoveSelection = (matchId: string) => {
    setSelections((prev) => prev.filter((s) => s.match.id !== matchId));
  };

  const handleClearSlip = () => {
    setSelections([]);
    setBetSuccessMsg(null);
    setBetErrorMsg(null);
  };

  // Ajout direct d'un pack "Top Combiné" suggéré
  const handleLoadPresetPack = (packSelections: { matchId: string; outcome: "HOME" | "DRAW" | "AWAY" }[]) => {
    const loaded: BetSelectionItem[] = [];
    for (const item of packSelections) {
      const match = matches.find((m) => m.id === item.matchId);
      if (match) {
        let odds = match.odds.home;
        let label = match.homeTeam;
        if (item.outcome === "DRAW") {
          odds = match.odds.draw;
          label = "Match Nul";
        } else if (item.outcome === "AWAY") {
          odds = match.odds.away;
          label = match.awayTeam;
        }
        loaded.push({ match, outcome: item.outcome, odds, label });
      }
    }
    if (loaded.length > 0) {
      setSelections(loaded);
      setSlipMode("MULTIPLE");
      setBetSuccessMsg(null);
      setBetErrorMsg(null);
    }
  };

  // Calculs du Bet Slip
  const totalOdds =
    selections.length > 0
      ? parseFloat(
          selections
            .reduce((acc, s) => acc * s.odds, 1)
            .toFixed(2)
        )
      : 1.0;

  const stakeCents = Math.max(10, stakeAmount) * 100;
  const potentialWinCents = Math.round(stakeCents * totalOdds);
  const hasEnoughBalance = balanceCents >= stakeCents;

  // Validation et placement du pari
  const handlePlaceBet = async () => {
    if (selections.length === 0) return;

    if (!hasEnoughBalance) {
      setBetErrorMsg("Solde insuffisant dans votre portefeuille pour cette mise.");
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
          stakeCents,
          selections: selections.map((s) => ({
            matchId: s.match.id,
            selectedOutcome: s.outcome,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setBetErrorMsg(data.error || "Impossible de placer le pari.");
        triggerWalletSync();
      } else {
        setBetSuccessMsg(
          `Fiche validée avec succès ! Ticket N° ${data.bet.betTicketNumber}`
        );
        triggerWalletSync(data.newBalanceCents);
        setTimeout(() => {
          setSelections([]);
          setBetSuccessMsg(null);
          setMobileSlipOpen(false);
        }, 3500);
      }
    } catch {
      setBetErrorMsg("Erreur réseau lors de la validation du coupon.");
    } finally {
      setPlacingBet(false);
    }
  };

  // Liste des ligues uniques
  const leagues = Array.from(new Set(matches.map((m) => m.leagueName)));

  // Filtrage combiné (League + Recherche + Mode Live + Coeff)
  let filteredMatches = matches.filter((m) => {
    if (selectedLeague !== "ALL" && m.leagueName !== selectedLeague) {
      return false;
    }
    if (
      searchMatchQuery.trim() &&
      !m.homeTeam.toLowerCase().includes(searchMatchQuery.toLowerCase()) &&
      !m.awayTeam.toLowerCase().includes(searchMatchQuery.toLowerCase()) &&
      !m.leagueName.toLowerCase().includes(searchMatchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  if (coeffSort === "ASC") {
    filteredMatches = [...filteredMatches].sort((a, b) => a.odds.home - b.odds.home);
  } else if (coeffSort === "DESC") {
    filteredMatches = [...filteredMatches].sort((a, b) => b.odds.home - a.odds.home);
  }

  // Rendu de l'interface du Panier
  const renderBetSlipContent = () => (
    <div className="space-y-4">
      {/* Onglets SIMPLE / MULTIPLE et Bouton Poubelle */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-3">
        <div className="flex items-center gap-1 bg-gray-950 p-1 rounded-xl border border-gray-800">
          <button
            onClick={() => setSlipMode("SIMPLE")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              slipMode === "SIMPLE"
                ? "bg-amber-500 text-gray-950 shadow"
                : "text-gray-400 hover:text-white"
            }`}
          >
            SIMPLE
          </button>
          <button
            onClick={() => setSlipMode("MULTIPLE")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              slipMode === "MULTIPLE"
                ? "bg-amber-500 text-gray-950 shadow"
                : "text-gray-400 hover:text-white"
            }`}
          >
            MULTIPLE {selections.length > 1 && `(${selections.length})`}
          </button>
        </div>

        {selections.length > 0 && (
          <button
            onClick={handleClearSlip}
            title="Vider le panier"
            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {selections.length === 0 ? (
        <div className="p-8 text-center text-gray-400 space-y-3">
          <div className="w-14 h-14 bg-gray-950 border border-gray-800 rounded-full flex items-center justify-center mx-auto text-gray-500">
            <ShoppingCart className="w-7 h-7" />
          </div>
          <div>
            <h4 className="font-bold text-white text-sm">Ton panier est vide</h4>
            <p className="text-xs text-gray-500 mt-1">
              Ajoute tes paris en cliquant sur les cotes (1, X, 2)
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Liste des sélections */}
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {selections.map((sel) => (
              <div
                key={sel.match.id}
                className="p-3 bg-gray-950 rounded-xl border border-gray-800 space-y-1.5 relative group hover:border-amber-500/40 transition-colors"
              >
                <button
                  onClick={() => handleRemoveSelection(sel.match.id)}
                  className="absolute top-2 right-2 text-gray-500 hover:text-red-400 p-0.5 rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="pr-6">
                  <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                    {sel.match.leagueName}
                  </span>
                  <p className="text-xs font-bold text-white leading-tight">
                    {sel.match.homeTeam} vs {sel.match.awayTeam}
                  </p>
                </div>

                <div className="flex justify-between items-center pt-1.5 border-t border-gray-850 text-xs">
                  <span className="text-gray-300">
                    Pari : <strong className="text-amber-300">{sel.label}</strong>
                  </span>
                  <span className="font-mono font-black text-amber-400 text-sm">
                    {sel.odds.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Saisie de la Mise & Boutons rapides */}
          <div className="space-y-2 pt-2 border-t border-gray-800">
            <div className="flex justify-between text-xs font-bold text-gray-400">
              <span>Mise en Gourdes :</span>
              <span className="text-white font-mono">{stakeAmount} HTG</span>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {[10, 50, 100, 250].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setStakeAmount(amt)}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                    stakeAmount === amt
                      ? "bg-amber-500 text-gray-950 font-black shadow"
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  {amt}G
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="number"
                min="10"
                step="10"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(Math.max(10, parseInt(e.target.value) || 10))}
                className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white font-mono font-bold focus:border-amber-400 focus:outline-none"
                placeholder="Montant libre"
              />
              <span className="text-xs font-bold text-gray-400">HTG</span>
            </div>
          </div>

          {/* Solde & Recharger */}
          <div className="flex justify-between items-center text-[11px] text-gray-400 px-1">
            <span>
              Solde :{" "}
              <strong className={hasEnoughBalance ? "text-emerald-400" : "text-red-400"}>
                {formatCurrency(balanceCents, "HTG", "fr")}
              </strong>
            </span>
            {!hasEnoughBalance && (
              <Link
                href="/wallet"
                className="text-amber-400 hover:underline font-bold"
              >
                Recharger +
              </Link>
            )}
          </div>

          {/* Résumé Gain Potentiel & Cote Totale */}
          <div className="p-3.5 bg-gradient-to-br from-emerald-950/40 to-gray-950 border border-emerald-500/30 rounded-2xl space-y-1.5">
            <div className="flex justify-between text-xs text-gray-300">
              <span>Cote Totale ({selections.length} {selections.length > 1 ? "matchs" : "match"}) :</span>
              <span className="font-mono font-black text-amber-400 text-base">{totalOdds.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-baseline pt-2 border-t border-emerald-500/20">
              <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider">
                Gain Potentiel :
              </span>
              <span className="text-emerald-300 font-mono text-xl font-black">
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

          {/* Bouton Placer le Pari */}
          <button
            disabled={placingBet || selections.length === 0}
            onClick={handlePlaceBet}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-black rounded-xl text-sm shadow-[0_4px_16px_rgba(16,185,129,0.35)] transition-all flex items-center justify-center gap-2 uppercase tracking-wider disabled:opacity-50"
          >
            {placingBet ? "Validation en cours..." : "PLACER MON PARI"}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto py-4 sm:py-6 space-y-6 px-3 sm:px-6 pb-32">
      {/* Bannière d'impact : Ak 10 Goud Sèlman */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950 via-gray-900 to-amber-950 border border-amber-500/30 p-5 sm:p-7 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-56 h-56 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-red-600 text-white font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                +18 Seulman
              </span>
              <span className="text-xs text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <Flame className="w-3.5 h-3.5" /> Paris Sportifs Haïti & International
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight">
              Ak <span className="text-amber-400">10 Goud</span> Sèlman, Ou ka genyen{" "}
              <span className="text-emerald-400 font-mono">1 000 000 Goud</span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-300 max-w-2xl">
              Fè fòmasyon combiné w, miltipliye kòt yo epi mete lajan nan pòch ou touswit sou GRATIKO !
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/sports/my-bets"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900/90 hover:bg-gray-800 border border-gray-700 hover:border-amber-400 rounded-xl text-xs font-bold text-amber-400 transition-all shadow"
            >
              <span>Mes Fiches & Paris</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Disposition Principale */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Colonne Gauche (Desktop) : Top Compétitions & Catégories */}
        <div className="hidden lg:block lg:col-span-3 space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" /> Top Compétitions
            </h3>

            <div className="space-y-1">
              <button
                onClick={() => setSelectedLeague("ALL")}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  selectedLeague === "ALL"
                    ? "bg-amber-500 text-gray-950 font-black"
                    : "text-gray-300 hover:bg-gray-800"
                }`}
              >
                <span>🌍 Tous les Matchs</span>
                <span className="font-mono text-[11px] opacity-75">{matches.length}</span>
              </button>

              {leagues.map((lg) => {
                const count = matches.filter((m) => m.leagueName === lg).length;
                return (
                  <button
                    key={lg}
                    onClick={() => setSelectedLeague(lg)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      selectedLeague === lg
                        ? "bg-amber-500 text-gray-950 font-black"
                        : "text-gray-300 hover:bg-gray-800"
                    }`}
                  >
                    <span>⚽ {lg}</span>
                    <span className="font-mono text-[11px] opacity-75">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bannière latérale Funbets */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-gray-900 to-amber-950/40 border border-gray-800 space-y-2">
            <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold">
              <Zap className="w-4 h-4" />
              <span>Garantie Transparence</span>
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              Cotes The Odds API connectées en temps réel aux plus grands bookmakers européens (Bet365, Pinnacle, 1xBet).
            </p>
          </div>
        </div>

        {/* Colonne Centre : Matchs + Barre de filtres Live / Prématch */}
        <div className="lg:col-span-6 space-y-4 sm:space-y-6">
          {/* 1. Onglets Switcher : ALL vs LIVE (Modèle Panel 4 & 5) */}
          <div className="flex items-center justify-between bg-gray-900 p-2 rounded-2xl border border-gray-800">
            <div className="grid grid-cols-2 gap-1 bg-gray-950 p-1 rounded-xl border border-gray-850">
              <button
                onClick={() => setViewMode("ALL")}
                className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${
                  viewMode === "ALL"
                    ? "bg-amber-500 text-gray-950 shadow"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                All (Prématch)
              </button>
              <button
                onClick={() => setViewMode("LIVE")}
                className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
                  viewMode === "LIVE"
                    ? "bg-red-600 text-white shadow animate-pulse"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Live en direct</span>
              </button>
            </div>

            {/* Tri Coeff */}
            <div className="flex items-center gap-1 text-[11px] text-gray-400">
              <span>Coeff:</span>
              <button
                onClick={() => setCoeffSort(coeffSort === "ASC" ? "NONE" : "ASC")}
                className={`px-2 py-1 rounded-lg border text-[10px] font-bold ${
                  coeffSort === "ASC" ? "bg-amber-500 text-gray-950 border-amber-400" : "bg-gray-950 border-gray-800"
                }`}
              >
                Asc
              </button>
              <button
                onClick={() => setCoeffSort(coeffSort === "DESC" ? "NONE" : "DESC")}
                className={`px-2 py-1 rounded-lg border text-[10px] font-bold ${
                  coeffSort === "DESC" ? "bg-amber-500 text-gray-950 border-amber-400" : "bg-gray-950 border-gray-800"
                }`}
              >
                Desc
              </button>
            </div>
          </div>

          {/* 2. Carousel Horizontal des Sports (Modèle Panel 4 & 5) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: "HOT", label: "🔥 Hot" },
              { id: "SOCCER", label: "⚽ Football" },
              { id: "BASKET", label: "🏀 Basketball" },
              { id: "TENNIS", label: "🎾 Tennis" },
              { id: "BASEBALL", label: "⚾ Baseball" },
              { id: "VOLLEY", label: "🏐 Volleyball" },
            ].map((sport) => (
              <button
                key={sport.id}
                onClick={() => setSelectedSport(sport.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedSport === sport.id
                    ? "bg-amber-500 text-gray-950 font-black shadow"
                    : "bg-gray-900 text-gray-400 hover:text-white border border-gray-800"
                }`}
              >
                {sport.label}
              </button>
            ))}
          </div>

          {/* 3. Recherche Match + Code Fiche (Modèle Panel 4 & 5) */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher équipe ou ligue..."
                value={searchMatchQuery}
                onChange={(e) => setSearchMatchQuery(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:border-amber-400 focus:outline-none"
              />
            </div>
            <button
              onClick={() => {
                const code = prompt("Entrez votre code de fiche (Betcode) :");
                if (code) alert(`Vérification du code fiche: ${code}`);
              }}
              className="px-3.5 py-2 bg-gray-900 hover:bg-gray-850 text-amber-400 border border-gray-800 rounded-xl text-xs font-black whitespace-nowrap"
            >
              Bet code
            </button>
          </div>

          {/* Section TOP COMBINÉS (Style Paryaj Lakay) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-amber-400" /> TOP COMBINÉS
              </h2>
              <span className="text-[11px] text-gray-400">1-clic pou ajoute nan fòmasyon w</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Combiné #1 */}
              <div className="p-3.5 rounded-2xl bg-gray-900 border border-gray-800 hover:border-amber-500/40 transition-all space-y-2.5 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="bg-emerald-500 text-gray-950 text-[10px] font-black px-2 py-0.5 rounded-md">
                      #1
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">2 708 fiches</span>
                  </div>
                  <div className="text-[11px] space-y-1 text-gray-300">
                    <p className="truncate font-semibold">Real Madrid vs Bayern: <strong>1</strong> (2.30)</p>
                    <p className="truncate font-semibold">Arsenal vs Chelsea: <strong>1</strong> (1.85)</p>
                    <p className="truncate font-semibold">Atalanta vs Parme: <strong>1</strong> (1.51)</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-800 flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-amber-400">Cote: 6.42</span>
                  <button
                    onClick={() =>
                      handleLoadPresetPack([
                        { matchId: "match-ucl-01", outcome: "HOME" },
                        { matchId: "match-epl-01", outcome: "HOME" },
                        { matchId: "match-seriea-01", outcome: "HOME" },
                      ])
                    }
                    className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500 hover:text-gray-950 text-amber-400 border border-amber-500/30 rounded-lg text-[11px] font-bold transition-all"
                  >
                    + Ajouter
                  </button>
                </div>
              </div>

              {/* Combiné #2 */}
              <div className="p-3.5 rounded-2xl bg-gray-900 border border-gray-800 hover:border-amber-500/40 transition-all space-y-2.5 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="bg-amber-500 text-gray-950 text-[10px] font-black px-2 py-0.5 rounded-md">
                      #2
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">3 786 fiches</span>
                  </div>
                  <div className="text-[11px] space-y-1 text-gray-300">
                    <p className="truncate font-semibold">Benfica vs Alverca: <strong>1</strong> (1.10)</p>
                    <p className="truncate font-semibold">Barcelone vs Atl. Madrid: <strong>1</strong> (1.95)</p>
                    <p className="truncate font-semibold">Atalanta vs Parme: <strong>1</strong> (1.51)</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-800 flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-amber-400">Cote: 3.24</span>
                  <button
                    onClick={() =>
                      handleLoadPresetPack([
                        { matchId: "match-primeira-01", outcome: "HOME" },
                        { matchId: "match-laliga-01", outcome: "HOME" },
                        { matchId: "match-seriea-01", outcome: "HOME" },
                      ])
                    }
                    className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500 hover:text-gray-950 text-amber-400 border border-amber-500/30 rounded-lg text-[11px] font-bold transition-all"
                  >
                    + Ajouter
                  </button>
                </div>
              </div>

              {/* Combiné #3 */}
              <div className="p-3.5 rounded-2xl bg-gray-900 border border-gray-800 hover:border-amber-500/40 transition-all space-y-2.5 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="bg-purple-500 text-white text-[10px] font-black px-2 py-0.5 rounded-md">
                      #3
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">3 407 fiches</span>
                  </div>
                  <div className="text-[11px] space-y-1 text-gray-300">
                    <p className="truncate font-semibold">Paris SG vs Man City: <strong>2</strong> (2.45)</p>
                    <p className="truncate font-semibold">Newcastle vs Everton: <strong>1</strong> (2.20)</p>
                    <p className="truncate font-semibold">Marseille vs Lyon: <strong>1</strong> (2.15)</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-800 flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-amber-400">Cote: 11.59</span>
                  <button
                    onClick={() =>
                      handleLoadPresetPack([
                        { matchId: "match-ucl-02", outcome: "AWAY" },
                        { matchId: "match-epl-02", outcome: "HOME" },
                        { matchId: "match-ligue1-01", outcome: "HOME" },
                      ])
                    }
                    className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500 hover:text-gray-950 text-amber-400 border border-amber-500/30 rounded-lg text-[11px] font-bold transition-all"
                  >
                    + Ajouter
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Liste des Matchs (Prématch ou Live selon viewMode) */}
          <div className="space-y-3">
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              {viewMode === "LIVE" ? (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                  <span className="text-red-400">Matchs en Direct (Live)</span>
                </>
              ) : (
                <>
                  <Trophy className="w-5 h-5 text-amber-400" />
                  <span>Matchs Officiels Prématch</span>
                </>
              )}
            </h2>

            {loading ? (
              <div className="p-12 text-center text-gray-500 space-y-2 bg-gray-900/50 rounded-2xl border border-gray-800">
                <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs">Chajman cotes ofisyèl The Odds API an dirèk...</p>
              </div>
            ) : filteredMatches.length === 0 ? (
              <div className="p-8 text-center text-gray-500 bg-gray-900/50 rounded-2xl border border-gray-800">
                Aucun match disponible pour cette sélection actuellement.
              </div>
            ) : (
              filteredMatches.map((m, index) => {
                const date = new Date(m.commenceTime);
                const currentSel = selections.find((s) => s.match.id === m.id);
                const isSelectedHome = currentSel?.outcome === "HOME";
                const isSelectedDraw = currentSel?.outcome === "DRAW";
                const isSelectedAway = currentSel?.outcome === "AWAY";

                // Données dynamiques de live pour simuler le direct (comme Panel 5)
                const mockMinute = 40 + (index * 13) % 50;
                const mockHomeScore = (index * 2) % 3;
                const mockAwayScore = (index + 1) % 2;

                return (
                  <div
                    key={m.id}
                    className="p-4 rounded-2xl bg-gray-900/90 border border-gray-800 hover:border-amber-500/30 transition-all space-y-3 shadow-lg"
                  >
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        {viewMode === "LIVE" ? (
                          <span className="bg-red-600 text-white font-black text-[10px] px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-white" />
                            LIVE {mockMinute}'
                          </span>
                        ) : (
                          <span className="font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 text-[11px]">
                            {m.leagueName}
                          </span>
                        )}
                      </div>

                      <span className="text-gray-400 font-mono text-[11px] flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {date.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}{" "}
                        • {date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    {/* Équipes et Score Live */}
                    <div className="flex items-center justify-between py-1">
                      <span className="font-black text-white text-sm sm:text-base flex-1">{m.homeTeam}</span>
                      
                      {viewMode === "LIVE" ? (
                        <div className="bg-gray-950 px-3 py-1 rounded-xl border border-gray-800 text-amber-400 font-black font-mono text-sm sm:text-base mx-2 shadow-inner">
                          {mockHomeScore} - {mockAwayScore}
                        </div>
                      ) : (
                        <span className="text-[11px] font-bold text-gray-500 px-2 uppercase">vs</span>
                      )}

                      <span className="font-black text-white text-sm sm:text-base text-right flex-1">{m.awayTeam}</span>
                    </div>

                    {/* Grille 1 X 2 */}
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <button
                        onClick={() => handleToggleSelection(m, "HOME")}
                        className={`py-2 px-2.5 rounded-xl border flex flex-col items-center justify-center transition-all ${
                          isSelectedHome
                            ? "bg-amber-500 text-gray-950 font-black border-amber-400 shadow-md scale-102"
                            : "bg-gray-800/90 hover:bg-gray-800 text-gray-200 border-gray-700"
                        }`}
                      >
                        <span className="text-[10px] uppercase font-bold opacity-75">1 (Dom.)</span>
                        <span className="text-sm font-black font-mono">{m.odds.home.toFixed(2)}</span>
                      </button>

                      <button
                        onClick={() => handleToggleSelection(m, "DRAW")}
                        className={`py-2 px-2.5 rounded-xl border flex flex-col items-center justify-center transition-all ${
                          isSelectedDraw
                            ? "bg-amber-500 text-gray-950 font-black border-amber-400 shadow-md scale-102"
                            : "bg-gray-800/90 hover:bg-gray-800 text-gray-200 border-gray-700"
                        }`}
                      >
                        <span className="text-[10px] uppercase font-bold opacity-75">Nul</span>
                        <span className="text-sm font-black font-mono">{m.odds.draw.toFixed(2)}</span>
                      </button>

                      <button
                        onClick={() => handleToggleSelection(m, "AWAY")}
                        className={`py-2 px-2.5 rounded-xl border flex flex-col items-center justify-center transition-all ${
                          isSelectedAway
                            ? "bg-amber-500 text-gray-950 font-black border-amber-400 shadow-md scale-102"
                            : "bg-gray-800/90 hover:bg-gray-800 text-gray-200 border-gray-700"
                        }`}
                      >
                        <span className="text-[10px] uppercase font-bold opacity-75">2 (Ext.)</span>
                        <span className="text-sm font-black font-mono">{m.odds.away.toFixed(2)}</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Colonne Droite (Desktop) : PANIER / BET SLIP FIXÉ */}
        <div className="hidden lg:block lg:col-span-3">
          <div className="sticky top-20 bg-gray-900 border border-amber-500/40 rounded-3xl p-5 shadow-2xl">
            <div className="flex items-center gap-2 mb-3">
              <ShoppingCart className="w-5 h-5 text-amber-400" />
              <h3 className="font-black text-white text-base uppercase tracking-wider">PANIER</h3>
            </div>
            {renderBetSlipContent()}
          </div>
        </div>
      </div>

      {/* BARRE FLOTTANTE MOBILE : Quand le joueur sélectionne au moins 1 match */}
      {selections.length > 0 && (
        <div
          className="lg:hidden fixed left-3 right-3 z-40 bg-gray-900/95 backdrop-blur-md border border-amber-500/50 rounded-2xl p-3 shadow-[0_8px_32px_rgba(0,0,0,0.85)] flex items-center justify-between transition-all animate-in slide-in-from-bottom"
          style={{
            bottom: "calc(env(safe-area-inset-bottom, 0px) + 68px)",
          }}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-gray-950 flex items-center justify-center font-black text-sm shadow">
              {selections.length}
            </div>
            <div>
              <p className="text-xs font-black text-white">
                Cote: <span className="text-amber-400 font-mono">{totalOdds.toFixed(2)}</span>
              </p>
              <p className="text-[11px] text-emerald-400 font-mono font-bold">
                Gain: {formatCurrency(potentialWinCents, "HTG", "fr")}
              </p>
            </div>
          </div>

          <button
            onClick={() => setMobileSlipOpen(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow uppercase tracking-wider flex items-center gap-1.5"
          >
            <span>Voir ma Fiche</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* MODAL / TIROIR DU PANIER SUR MOBILE */}
      {mobileSlipOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col justify-end">
          <div
            className="bg-gray-900 border-t border-amber-500/50 rounded-t-3xl p-5 space-y-4 max-h-[85vh] overflow-y-auto shadow-2xl"
            style={{
              paddingBottom: "max(calc(env(safe-area-inset-bottom, 0px) + 24px), 32px)",
            }}
          >
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-amber-400" />
                <h3 className="font-black text-white text-base uppercase tracking-wider">
                  Ma Fiche de Pari ({selections.length})
                </h3>
              </div>
              <button
                onClick={() => setMobileSlipOpen(false)}
                className="p-1.5 text-gray-400 hover:text-white rounded-lg bg-gray-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {renderBetSlipContent()}
          </div>
        </div>
      )}
    </div>
  );
}
