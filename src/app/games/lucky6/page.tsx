"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/i18n";
import { triggerWalletSync, subscribeWalletSync } from "@/lib/wallet-sync";
import {
  ArrowLeft,
  Clock,
  RefreshCw,
  Trophy,
  Play,
  RotateCcw,
  Sparkles,
  AlertCircle,
  Flame,
  CheckCircle2,
} from "lucide-react";

// 6 groupes de couleurs officielles Lucky 6
const BALL_COLORS = [
  { name: "red", bg: "bg-red-600", text: "text-white", border: "border-red-400" },
  { name: "green", bg: "bg-emerald-600", text: "text-white", border: "border-emerald-400" },
  { name: "blue", bg: "bg-blue-600", text: "text-white", border: "border-blue-400" },
  { name: "purple", bg: "bg-purple-600", text: "text-white", border: "border-purple-400" },
  { name: "brown", bg: "bg-amber-800", text: "text-white", border: "border-amber-600" },
  { name: "yellow", bg: "bg-yellow-500", text: "text-gray-950", border: "border-yellow-300" },
];

function getBallColor(num: number) {
  return BALL_COLORS[(num - 1) % BALL_COLORS.length];
}

export default function Lucky6GamePage() {
  const [balanceCents, setBalanceCents] = useState<number>(0);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [drawnBalls, setDrawnBalls] = useState<{ number: number; color: string }[]>([]);
  const [roundNumber, setRoundNumber] = useState<number>(2792803);
  const [countdown, setCountdown] = useState<number>(25);
  const [stakeAmount, setStakeAmount] = useState<number>(50); // 50 HTG
  const [isPlaying, setIsPlaying] = useState(false);
  const [lastWin, setLastWin] = useState<{ amountCents: number; multiplier: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
    setRoundNumber(Math.floor(2700000 + Math.random() * 900000));

    // Compte à rebours du round
    const timer = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? 45 : prev - 1));
    }, 1000);

    const unsub = subscribeWalletSync((bal) => {
      if (typeof bal === "number") setBalanceCents(bal);
      else fetchBalance();
    });

    return () => {
      clearInterval(timer);
      unsub();
    };
  }, []);

  const toggleBall = (num: number) => {
    if (isPlaying) return;
    setErrorMessage(null);

    if (selectedNumbers.includes(num)) {
      setSelectedNumbers(selectedNumbers.filter((n) => n !== num));
    } else {
      if (selectedNumbers.length >= 6) {
        setErrorMessage("Lucky 6 se joue avec exactement 6 numéros.");
        return;
      }
      setSelectedNumbers([...selectedNumbers, num]);
    }
  };

  const handleRandom = () => {
    if (isPlaying) return;
    const randomSet = new Set<number>();
    while (randomSet.size < 6) {
      randomSet.add(Math.floor(Math.random() * 48) + 1);
    }
    setSelectedNumbers(Array.from(randomSet));
    setErrorMessage(null);
  };

  const handleClear = () => {
    if (isPlaying) return;
    setSelectedNumbers([]);
    setDrawnBalls([]);
    setLastWin(null);
    setErrorMessage(null);
  };

  const handleStartGame = async () => {
    if (selectedNumbers.length !== 6) {
      setErrorMessage("Veuillez sélectionner exactement 6 boules pour jouer.");
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
    setDrawnBalls([]);

    try {
      const res = await fetch("/api/games/play", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameType: "LUCKY6",
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

      const rawDrawn: { number: number; color: string }[] = data.result.outcomeData.drawnBalls || [];

      // Animation progressive de sortie des boules
      let currentDrawn: { number: number; color: string }[] = [];
      for (let i = 0; i < rawDrawn.length; i++) {
        await new Promise((r) => setTimeout(r, 60));
        currentDrawn.push(rawDrawn[i]);
        setDrawnBalls([...currentDrawn]);
      }

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

      {/* Cadre de jeu Lucky 6 bleu nuit étoilé (Modèle Panel 8) */}
      <div className="bg-gradient-to-b from-[#0c1427] via-[#091020] to-[#050914] border-2 border-indigo-900/60 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4 relative overflow-hidden">
        {/* Header avec Compte à Rebours (Modèle Panel 8) */}
        <div className="flex items-center justify-between bg-black/40 rounded-2xl p-3 border border-indigo-800/40">
          <div>
            <span className="text-[10px] text-gray-400 font-mono block">Round :</span>
            <span className="text-xs sm:text-sm font-black font-mono text-white">
              {roundNumber}
            </span>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-[10px] text-gray-400 uppercase font-bold flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-400" /> Prochain tirage
            </span>
            <span className="text-base sm:text-lg font-black font-mono text-amber-400">
              00:{countdown < 10 ? `0${countdown}` : countdown}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-gray-400 block font-bold">Max Gain :</span>
            <span className="text-xs sm:text-sm font-black font-mono text-emerald-400">
              x10 000
            </span>
          </div>
        </div>

        {/* Plateau des boules tirées lors du tour */}
        <div className="bg-[#040711] border border-indigo-900/80 rounded-2xl p-3 min-h-[58px] flex items-center overflow-x-auto gap-1.5 scrollbar-none shadow-inner">
          {drawnBalls.length === 0 ? (
            <p className="text-[11px] text-indigo-400/60 italic text-center w-full">
              Les 35 boules tirées apparaîtront ici dès le lancement du tour...
            </p>
          ) : (
            drawnBalls.map((b, idx) => {
              const isUserPicked = selectedNumbers.includes(b.number);
              const colorConfig = getBallColor(b.number);

              return (
                <div
                  key={idx}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-black text-xs font-mono shrink-0 shadow-lg animate-in zoom-in ${
                    colorConfig.bg
                  } ${colorConfig.text} ${
                    isUserPicked ? "ring-2 ring-yellow-400 scale-110 shadow-[0_0_10px_rgba(250,204,21,0.9)]" : ""
                  }`}
                >
                  {b.number}
                </div>
              );
            })
          )}
        </div>

        {/* Grille des 48 boules multicolores (6 colonnes sur mobile, 8 sur desktop) */}
        <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 sm:gap-2.5 py-2">
          {Array.from({ length: 48 }, (_, i) => i + 1).map((num) => {
            const isSelected = selectedNumbers.includes(num);
            const isDrawn = drawnBalls.some((b) => b.number === num);
            const colorConfig = getBallColor(num);

            return (
              <button
                key={num}
                onClick={() => toggleBall(num)}
                disabled={isPlaying}
                className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full font-black font-mono text-xs sm:text-sm flex items-center justify-center mx-auto transition-all shadow-md active:scale-95 ${
                  colorConfig.bg
                } ${colorConfig.text} ${
                  isSelected
                    ? "ring-4 ring-yellow-400 scale-110 shadow-[0_0_16px_rgba(250,204,21,1)]"
                    : isDrawn
                    ? "opacity-50 ring-1 ring-white/50"
                    : "hover:scale-105"
                }`}
              >
                {num}
              </button>
            );
          })}
        </div>

        {/* 3 Grands Boutons d'Action comme sur la maquette Panel 8 : CLEAR, BET, RANDOM */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-2">
          <button
            onClick={handleClear}
            disabled={isPlaying}
            className="py-3 sm:py-3.5 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg uppercase tracking-wider transition-all disabled:opacity-50"
          >
            CLEAR
          </button>

          <button
            onClick={handleStartGame}
            disabled={isPlaying || selectedNumbers.length !== 6}
            className="py-3 sm:py-3.5 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-gray-950 font-black text-xs sm:text-sm rounded-2xl shadow-[0_4px_16px_rgba(16,185,129,0.4)] uppercase tracking-wider transition-all disabled:opacity-50"
          >
            {isPlaying ? "TIRAGE..." : "BET"}
          </button>

          <button
            onClick={handleRandom}
            disabled={isPlaying}
            className="py-3 sm:py-3.5 bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg uppercase tracking-wider transition-all disabled:opacity-50"
          >
            RANDOM
          </button>
        </div>

        {/* Plateau des 6 boules sélectionnées par le joueur (Modèle Panel 8) */}
        <div className="bg-black/50 border border-indigo-900/60 rounded-2xl p-3 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400 font-bold uppercase tracking-wider text-[11px]">
              Vos 6 numéros choisis :
            </span>
            <div className="flex items-center gap-1">
              {[10, 25, 50, 100, 250].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setStakeAmount(amt)}
                  disabled={isPlaying}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                    stakeAmount === amt
                      ? "bg-amber-500 text-gray-950 font-black shadow"
                      : "bg-gray-800 text-gray-300"
                  }`}
                >
                  {amt}G
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 sm:gap-3 py-1">
            {Array.from({ length: 6 }).map((_, idx) => {
              const num = selectedNumbers[idx];
              const colorConfig = num ? getBallColor(num) : null;

              return (
                <div
                  key={idx}
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 flex items-center justify-center font-black font-mono text-sm shadow-md transition-all ${
                    num && colorConfig
                      ? `${colorConfig.bg} ${colorConfig.text} ring-2 ring-white/60 scale-105`
                      : "border-dashed border-gray-700 bg-gray-900/80 text-gray-600"
                  }`}
                >
                  {num || "?"}
                </div>
              );
            })}
          </div>

          {lastWin && (
            <div className="p-3 bg-amber-500/20 border border-amber-500/50 rounded-xl text-center animate-in bounce-in">
              <p className="text-xs text-amber-300 font-bold uppercase">🎉 GAGNÉ SUR LUCKY 6 !</p>
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
        </div>
      </div>
    </div>
  );
}
