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

  // Vue All vs Live (Modèle officiel Image 2)
  const [viewMode, setViewMode] = useState<"ALL" | "LIVE">("ALL");
  const [selectedSport, setSelectedSport] = useState<string>("HOT");
  const [searchMatchQuery, setSearchMatchQuery] = useState<string>("");
  const [coeffSort, setCoeffSort] = useState<"NONE" | "AM" | "DE">("NONE");

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
        if (existing.outcome === outcome) {
          return prev.filter((_, idx) => idx !== existingIndex);
        }
        const updated = [...prev];
        updated[existingIndex] = { match, outcome, odds, label };
        return updated;
      }

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

  // Filtrage combiné
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

  if (coeffSort === "AM") {
    filteredMatches = [...filteredMatches].sort((a, b) => a.odds.home - b.odds.home);
  } else if (coeffSort === "DE") {
    filteredMatches = [...filteredMatches].sort((a, b) => b.odds.home - a.odds.home);
  }

  // Rendu de l'interface du Panier
  const renderBetSlipContent = () => (
    <div className="space-y-4">
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

          <div className="pt-2 pb-6">
            <button
              disabled={placingBet || selections.length === 0}
              onClick={handlePlaceBet}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-black rounded-xl text-base shadow-[0_4px_24px_rgba(16,185,129,0.5)] transition-all flex items-center justify-center gap-2 uppercase tracking-wider disabled:opacity-50"
            >
              {placingBet ? "Validation en cours..." : "PLACER MON PARI"}
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-4 pb-20">
      {/* 1. Bannière d'impact Football ParyajPam (Modèle officiel Image 2) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0d1627] via-[#101e38] to-[#142340] border border-[#1b2b48] p-4 sm:p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
          <div className="space-y-1">
            <span className="text-[10px] bg-red-600 text-white font-black px-2 py-0.5 rounded uppercase">
              FOUTBÒL LIVE & 1X2
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white leading-tight">
              Ak <span className="text-amber-400">10 Goud</span> Sèlman, Miltipliye Kòt yo jiska{" "}
              <span className="text-emerald-400 font-mono">1 000 000 Goud</span>
            </h1>
          </div>
          <Link
            href="/sports/my-bets"
            className="px-3.5 py-2 bg-[#16233b] hover:bg-[#1e2f4f] border border-[#23375a] text-amber-400 text-xs font-bold rounded-xl whitespace-nowrap self-start sm:self-center"
          >
            Mes Fiches ({selections.length})
          </Link>
        </div>
      </div>

      {/* 2. Sub-Bar : All | Live | Coeff [AM] [DE] (Modèle officiel Image 2) */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-2 text-xs">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setViewMode("ALL")}
            className={`font-black pb-1.5 transition-all ${
              viewMode === "ALL"
                ? "text-amber-400 border-b-2 border-amber-400"
                : "text-gray-400 hover:text-white"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setViewMode("LIVE")}
            className={`font-black pb-1.5 transition-all flex items-center gap-1 ${
              viewMode === "LIVE"
                ? "text-amber-400 border-b-2 border-amber-400"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
            Live
          </button>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
          <span>Coeff.</span>
          <button
            onClick={() => setCoeffSort(coeffSort === "AM" ? "NONE" : "AM")}
            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              coeffSort === "AM" ? "bg-amber-400 text-gray-950 font-black" : "bg-[#16233b] text-gray-300"
            }`}
          >
            AM
          </button>
          <button
            onClick={() => setCoeffSort(coeffSort === "DE" ? "NONE" : "DE")}
            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              coeffSort === "DE" ? "bg-amber-400 text-gray-950 font-black" : "bg-[#16233b] text-gray-300"
            }`}
          >
            DE
          </button>
        </div>
      </div>

      {/* 3. Carousel Horizontal des Sports (Modèle officiel Image 2) */}
      <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none text-xs">
        {[
          { id: "HOT", label: "Hot", icon: <Flame className="w-4 h-4 text-amber-400" /> },
          { id: "SOCCER", label: "Football", icon: "⚽" },
          { id: "BASKET", label: "Basketball", icon: "🏀" },
          { id: "AMERICA", label: "America...", icon: "🏈" },
          { id: "TENNIS", label: "Tennis", icon: "🎾" },
          { id: "ICE", label: "Ice hock...", icon: "🏒" },
          { id: "VOLLEY", label: "Volley...", icon: "🏐" },
        ].map((sport) => (
          <button
            key={sport.id}
            onClick={() => setSelectedSport(sport.id)}
            className={`flex flex-col items-center gap-1 min-w-[58px] py-1 transition-all ${
              selectedSport === sport.id
                ? "text-amber-400 font-black"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <span className="text-base">{sport.icon}</span>
            <span className="text-[10px] truncate">{sport.label}</span>
            {selectedSport === sport.id && (
              <span className="w-4 h-0.5 bg-amber-400 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* 4. Barre de Recherche + Bet code (Modèle officiel Image 2) */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search"
            value={searchMatchQuery}
            onChange={(e) => setSearchMatchQuery(e.target.value)}
            className="w-full bg-[#0c1424] border border-[#18253c] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:border-amber-400 focus:outline-none"
          />
        </div>
        <button
          onClick={() => {
            const code = prompt("Entrez votre code de fiche (Betcode) :");
            if (code) alert(`Vérification de la fiche : ${code}`);
          }}
          className="px-4 py-2 bg-[#16233b] hover:bg-[#1e2f4f] text-gray-200 border border-[#23375a] rounded-xl text-xs font-black whitespace-nowrap"
        >
          Bet code
        </button>
      </div>

      {/* Grille Desktop 2 Colonnes : Matchs + Panier */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-1">
        {/* Colonne des Matchs (8 cols desktop) */}
        <div className="lg:col-span-8 space-y-4">
          {loading ? (
            <div className="p-12 text-center text-gray-500 space-y-2 bg-[#0c1424] rounded-2xl border border-gray-800">
              <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs">Chargement des cotes officielles...</p>
            </div>
          ) : filteredMatches.length === 0 ? (
            <div className="p-8 text-center text-gray-500 bg-[#0c1424] rounded-2xl border border-gray-800">
              Aucun match disponible pour cette sélection actuellement.
            </div>
          ) : (
            /* Regroupement par Compétitions comme sur Image 2 */
            leagues.map((league) => {
              const leagueMatches = filteredMatches.filter((m) => m.leagueName === league);
              if (leagueMatches.length === 0) return null;

              return (
                <div key={league} className="space-y-2">
                  {/* Barre d'en-tête de la Ligue (Style Image 2 : Football. England. Premier League) */}
                  <div className="flex items-center gap-2 px-3 py-2 bg-[#0e1728] border border-[#18263e] rounded-xl text-xs font-bold text-gray-300">
                    <span>⚽</span>
                    <span className="truncate">Football. {league}</span>
                  </div>

                  {/* Lignes de Matchs (Exactement le layout Image 2) */}
                  <div className="divide-y divide-[#16233b] bg-[#0c1424] border border-[#18263e] rounded-2xl overflow-hidden shadow-lg">
                    {leagueMatches.map((m, idx) => {
                      const date = new Date(m.commenceTime);
                      const currentSel = selections.find((s) => s.match.id === m.id);
                      const isSelectedHome = currentSel?.outcome === "HOME";
                      const isSelectedDraw = currentSel?.outcome === "DRAW";
                      const isSelectedAway = currentSel?.outcome === "AWAY";

                      const mockMarkets = 150 + ((idx * 17) % 70);

                      return (
                        <div
                          key={m.id}
                          className="p-3 flex items-center justify-between gap-3 hover:bg-[#101b2f] transition-colors"
                        >
                          {/* Colonne Gauche : Équipes & Date */}
                          <div className="flex-1 min-w-0 pr-2">
                            <p className="font-bold text-white text-xs sm:text-sm truncate">
                              {m.homeTeam}
                            </p>
                            <p className="font-bold text-white text-xs sm:text-sm truncate">
                              {m.awayTeam}
                            </p>
                            <div className="flex items-center gap-2 text-[10px] text-gray-400 font-mono mt-1">
                              <span>
                                {date.toLocaleDateString("en-US", { month: "short", day: "2-digit" })} /{" "}
                                {date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })}
                              </span>
                              <span className="text-gray-500">+{mockMarkets}</span>
                            </div>
                          </div>

                          {/* Colonne Droite : 3 Boutons Win1, Draw, Win2 (Style Image 2) */}
                          <div className="shrink-0 flex flex-col items-center">
                            <div className="grid grid-cols-3 gap-1.5 w-48 sm:w-56 text-center text-[10px] text-gray-400 font-semibold mb-1">
                              <span>Win1</span>
                              <span>Draw</span>
                              <span>Win2</span>
                            </div>

                            <div className="grid grid-cols-3 gap-1.5 w-48 sm:w-56">
                              {/* Win1 */}
                              <button
                                onClick={() => handleToggleSelection(m, "HOME")}
                                className={`py-2 rounded-lg font-mono font-black text-xs transition-all ${
                                  isSelectedHome
                                    ? "bg-amber-400 text-gray-950 shadow-md scale-102"
                                    : "bg-[#142036] hover:bg-[#1b2b48] text-white border border-[#213352]"
                                }`}
                              >
                                {m.odds.home.toFixed(2)}
                              </button>

                              {/* Draw */}
                              <button
                                onClick={() => handleToggleSelection(m, "DRAW")}
                                className={`py-2 rounded-lg font-mono font-black text-xs transition-all ${
                                  isSelectedDraw
                                    ? "bg-amber-400 text-gray-950 shadow-md scale-102"
                                    : "bg-[#142036] hover:bg-[#1b2b48] text-white border border-[#213352]"
                                }`}
                              >
                                {m.odds.draw.toFixed(2)}
                              </button>

                              {/* Win2 */}
                              <button
                                onClick={() => handleToggleSelection(m, "AWAY")}
                                className={`py-2 rounded-lg font-mono font-black text-xs transition-all ${
                                  isSelectedAway
                                    ? "bg-amber-400 text-gray-950 shadow-md scale-102"
                                    : "bg-[#142036] hover:bg-[#1b2b48] text-white border border-[#213352]"
                                }`}
                              >
                                {m.odds.away.toFixed(2)}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Colonne Droite (Desktop) : Panier Fixé */}
        <div className="hidden lg:block lg:col-span-4">
          <div className="sticky top-20 bg-[#0c1424] border border-[#1b2b48] rounded-2xl p-4 shadow-xl">
            <div className="flex items-center gap-2 mb-3">
              <ShoppingCart className="w-5 h-5 text-amber-400" />
              <h3 className="font-black text-white text-sm uppercase tracking-wider">PANIER (Bet Slip)</h3>
            </div>
            {renderBetSlipContent()}
          </div>
        </div>
      </div>

      {/* Barre Flottante Mobile */}
      {selections.length > 0 && (
        <div
          className="lg:hidden fixed left-2 right-2 z-40 bg-[#0d1627]/98 backdrop-blur-md border border-amber-500/50 rounded-2xl p-2.5 shadow-[0_8px_30px_rgba(0,0,0,0.9)] flex items-center justify-between"
          style={{
            bottom: "calc(env(safe-area-inset-bottom, 8px) + 52px)",
          }}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-gray-950 flex items-center justify-center font-black text-xs shadow">
              {selections.length}
            </div>
            <div>
              <p className="text-xs font-black text-white">
                Cote : <span className="text-amber-400 font-mono">{totalOdds.toFixed(2)}</span>
              </p>
              <p className="text-[11px] text-emerald-400 font-mono font-bold">
                Gain : {formatCurrency(potentialWinCents, "HTG", "fr")}
              </p>
            </div>
          </div>

          <button
            onClick={() => setMobileSlipOpen(true)}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-black text-xs rounded-xl shadow uppercase tracking-wider flex items-center gap-1"
          >
            <span>Voir ma Fiche</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tiroir Modal Mobile du Panier */}
      {mobileSlipOpen && (
        <div className="lg:hidden fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex flex-col justify-end">
          <div
            className="bg-[#0c1424] border-t border-[#1b2b48] rounded-t-3xl p-4 space-y-3 max-h-[88vh] overflow-y-auto shadow-2xl"
            style={{
              paddingBottom: "max(calc(env(safe-area-inset-bottom, 0px) + 36px), 52px)",
            }}
          >
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-amber-400" />
                <h3 className="font-black text-white text-sm uppercase tracking-wider">
                  Ma Fiche ({selections.length})
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
