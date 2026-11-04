"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/i18n";
import { triggerWalletSync, subscribeWalletSync } from "@/lib/wallet-sync";
import {
  ArrowLeft,
  Sparkles,
  RefreshCw,
  Trophy,
  Play,
  RotateCcw,
  Zap,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Flame,
} from "lucide-react";

export default function Keno80GamePage() {
  const [balanceCents, setBalanceCents] = useState<number>(0);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [drawnNumbers, setDrawnNumbers] = useState<number[]>([]);
  const [matchedNumbers, setMatchedNumbers] = useState<number[]>([]);
  const [roundNumber, setRoundNumber] = useState<number>(155125566);
  const [stakeAmount, setStakeAmount] = useState<number>(50); // 50 HTG
  const [isPlaying, setIsPlaying] = useState(false);
  const [lastWin, setLastWin] = useState<{ amountCents: number; multiplier: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Jackpots dynamiques Keno
  const [jackpots, setJackpots] = useState({
    silver: 15744,
    gold: 11583,
    max: 8214,
  });

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

    fetchBalance();
    setRoundNumber(Math.floor(150000000 + Math.random() * 90000000));

    const unsub = subscribeWalletSync((bal) => {
      if (typeof bal === "number") setBalanceCents(bal);
      else fetchBalance();
    });

    return () => unsub();
  }, []);

  const toggleNumber = (num: number) => {
    if (isPlaying) return;
    setErrorMessage(null);

    if (selectedNumbers.includes(num)) {
      setSelectedNumbers(selectedNumbers.filter((n) => n !== num));
    } else {
      if (selectedNumbers.length >= 10) {
        setErrorMessage("Vous pouvez choisir au maximum 10 numéros.");
        return;
      }
      setSelectedNumbers([...selectedNumbers, num]);
    }
  };

  const handleRandomPick = () => {
    if (isPlaying) return;
    const randomSet = new Set<number>();
    while (randomSet.size < 6) {
      randomSet.add(Math.floor(Math.random() * 80) + 1);
    }
    setSelectedNumbers(Array.from(randomSet));
    setErrorMessage(null);
  };

  const handleClear = () => {
    if (isPlaying) return;
    setSelectedNumbers([]);
    setDrawnNumbers([]);
    setMatchedNumbers([]);
    setLastWin(null);
    setErrorMessage(null);
  };

  const handleStartGame = async () => {
    if (selectedNumbers.length === 0) {
      setErrorMessage("Veuillez sélectionner au moins un numéro (entre 1 et 10).");
      return;
    }

    const betCents = stakeAmount * 100;
    if (balanceCents < betCents) {
      setErrorMessage("Solde insuffisant dans votre portefeuille pour cette mise.");
      return;
    }

    setIsPlaying(true);
    setErrorMessage(null);
    setLastWin(null);
    setDrawnNumbers([]);
    setMatchedNumbers([]);

    try {
      const res = await fetch("/api/games/play", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameType: "KENO",
          betCents,
          choice: selectedNumbers,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Erreur de tirage");
        setIsPlaying(false);
        triggerWalletSync();
        return;
      }

      const resultDrawn: number[] = data.result.outcomeData.drawnNumbers || [];
      const resultMatched: number[] = data.result.outcomeData.matchedNumbers || [];

      // Animation progressive de sortie des 20 boules
      let currentDrawn: number[] = [];
      for (let i = 0; i < resultDrawn.length; i++) {
        await new Promise((r) => setTimeout(r, 65));
        currentDrawn.push(resultDrawn[i]);
        setDrawnNumbers([...currentDrawn]);
      }

      setMatchedNumbers(resultMatched);
      setRoundNumber((prev) => prev + 1);

      if (data.result.won) {
        setLastWin({
          amountCents: data.result.prizeCents,
          multiplier: data.result.multiplier,
        });
      }

      triggerWalletSync(data.result.newBalanceCents);
    } catch {
      setErrorMessage("Erreur de connexion.");
    } finally {
      setIsPlaying(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-4 sm:py-6 space-y-4 px-3 sm:px-6 pb-28">
      {/* Barre de retour et Solde */}
      <div className="flex items-center justify-between">
        <Link
          href="/games"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Retour aux Jeux
        </Link>

        <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 px-3 py-1 rounded-xl">
          <span className="text-[11px] text-gray-400">Solde :</span>
          <span className="text-xs font-black font-mono text-emerald-400">
            {formatCurrency(balanceCents, "HTG", "fr")}
          </span>
        </div>
      </div>

      {/* Jackpots Tickers en haut (Modèle Panel 7) */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-gradient-to-b from-gray-900 to-gray-950 border border-gray-800 rounded-xl p-2">
          <p className="text-[9px] uppercase font-bold text-gray-400">SILVER JACKPOT</p>
          <p className="text-xs sm:text-sm font-black font-mono text-amber-300">
            {jackpots.silver.toLocaleString()} HTG
          </p>
        </div>
        <div className="bg-gradient-to-b from-amber-950/40 to-gray-950 border border-amber-500/40 rounded-xl p-2 shadow-lg">
          <p className="text-[9px] uppercase font-bold text-amber-400 flex items-center justify-center gap-1">
            <Flame className="w-3 h-3 text-amber-400" /> GOLD JACKPOT
          </p>
          <p className="text-xs sm:text-sm font-black font-mono text-amber-400">
            {jackpots.gold.toLocaleString()} HTG
          </p>
        </div>
        <div className="bg-gradient-to-b from-emerald-950/40 to-gray-950 border border-emerald-500/40 rounded-xl p-2">
          <p className="text-[9px] uppercase font-bold text-emerald-400">MAXIMUM JACKPOT</p>
          <p className="text-xs sm:text-sm font-black font-mono text-emerald-300">
            {jackpots.max.toLocaleString()} HTG
          </p>
        </div>
      </div>

      {/* Plateau de jeu KENO Vert Casino (Modèle fidèle à la maquette Panel 7) */}
      <div className="bg-[#0b3b1e] border-4 border-[#166534] rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4 relative overflow-hidden">
        {/* Bandeau d'en-tête du tirage */}
        <div className="flex items-center justify-between bg-black/40 rounded-2xl p-2.5 border border-emerald-700/50">
          <div className="flex items-center gap-2">
            <span className="text-[10px] sm:text-xs font-mono font-bold text-emerald-300">
              ROUND Nº : <strong className="text-white">{roundNumber}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRandomPick}
              disabled={isPlaying}
              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-gray-950 text-[10px] sm:text-xs font-black rounded-lg transition-all"
            >
              RANDOM
            </button>
            <button
              onClick={handleClear}
              disabled={isPlaying}
              className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white text-[10px] sm:text-xs font-black rounded-lg transition-all"
            >
              CLEAR
            </button>
          </div>
        </div>

        {/* Tube supérieur de sortie des boules tirées */}
        <div className="bg-[#062412] border-2 border-emerald-600/60 rounded-2xl p-2.5 min-h-[52px] flex items-center overflow-x-auto gap-1.5 scrollbar-none shadow-inner">
          {drawnNumbers.length === 0 ? (
            <p className="text-[11px] text-emerald-400/60 italic text-center w-full">
              Les 20 boules tirées apparaîtront ici dès le lancement...
            </p>
          ) : (
            drawnNumbers.map((num, idx) => {
              const isMatch = selectedNumbers.includes(num);
              return (
                <div
                  key={idx}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-black text-xs font-mono shrink-0 shadow-md transform animate-in zoom-in ${
                    isMatch
                      ? "bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-600 text-gray-950 ring-2 ring-white scale-105"
                      : "bg-gradient-to-br from-emerald-400 to-emerald-700 text-white"
                  }`}
                >
                  {num}
                </div>
              );
            })
          )}
        </div>

        {/* Grille des 80 numéros (8 colonnes sur mobile, 10 sur desktop) */}
        <div className="grid grid-cols-8 sm:grid-cols-10 gap-1 sm:gap-1.5">
          {Array.from({ length: 80 }, (_, i) => i + 1).map((num) => {
            const isSelected = selectedNumbers.includes(num);
            const isDrawn = drawnNumbers.includes(num);
            const isMatched = isSelected && isDrawn;

            return (
              <button
                key={num}
                onClick={() => toggleNumber(num)}
                disabled={isPlaying}
                className={`h-9 sm:h-10 rounded-lg sm:rounded-xl font-bold font-mono text-xs sm:text-sm flex items-center justify-center transition-all ${
                  isMatched
                    ? "bg-amber-400 text-gray-950 font-black ring-2 ring-white scale-105 shadow-[0_0_12px_rgba(251,191,36,0.8)] animate-pulse"
                    : isSelected
                    ? "bg-yellow-500 text-gray-950 font-black shadow-md scale-102"
                    : isDrawn
                    ? "bg-emerald-700/80 text-emerald-200 border border-emerald-500/40"
                    : "bg-[#14532d] hover:bg-[#166534] text-emerald-100 border border-emerald-800/80 active:scale-95"
                }`}
              >
                {num}
              </button>
            );
          })}
        </div>

        {/* Panneau de Contrôle & Mise (Modèle Panel 7) */}
        <div className="bg-black/50 border border-emerald-700/50 rounded-2xl p-3 sm:p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-3">
              <span className="text-gray-300 font-semibold">
                Choix : <strong className="text-amber-400 font-mono">{selectedNumbers.length}/10</strong>
              </span>
              <span className="text-gray-300 font-semibold">
                Gagnants : <strong className="text-emerald-400 font-mono">{matchedNumbers.length}</strong>
              </span>
            </div>

            {/* Mises rapides */}
            <div className="flex items-center gap-1.5">
              <span className="text-gray-400 text-[11px] mr-1">Mise :</span>
              {[10, 25, 50, 100, 250].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setStakeAmount(amt)}
                  disabled={isPlaying}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    stakeAmount === amt
                      ? "bg-amber-500 text-gray-950 font-black shadow"
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  {amt}G
                </button>
              ))}
            </div>
          </div>

          {/* Affichage des gains du tour */}
          {lastWin && (
            <div className="p-3 bg-amber-500/20 border border-amber-500/50 rounded-xl text-center animate-in bounce-in">
              <p className="text-xs text-amber-300 font-bold uppercase">🎉 FÉLICITATIONS !</p>
              <p className="text-lg sm:text-xl font-black text-amber-400 font-mono">
                +{formatCurrency(lastWin.amountCents, "HTG", "fr")} ({lastWin.multiplier}x)
              </p>
            </div>
          )}

          {errorMessage && (
            <div className="p-2.5 bg-red-500/20 border border-red-500/40 rounded-xl text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Grand Bouton Rouge START (Exactement comme sur la maquette Panel 7) */}
          <button
            onClick={handleStartGame}
            disabled={isPlaying}
            className="w-full py-4 bg-gradient-to-r from-red-600 via-rose-500 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black text-base sm:text-lg rounded-2xl shadow-[0_6px_20px_rgba(220,38,38,0.45)] uppercase tracking-wider flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-50"
          >
            {isPlaying ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Tirage des boules en cours...</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                <span>START • LANCER LE KENO ({stakeAmount} HTG)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
