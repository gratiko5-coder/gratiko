"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/i18n";
import { triggerWalletSync, subscribeWalletSync } from "@/lib/wallet-sync";
import { ArrowLeft, Dices, ShieldCheck, Sparkles, Shuffle } from "lucide-react";

export default function LotoMinutePage() {
  const [balanceCents, setBalanceCents] = useState<number>(0);
  const [betCents, setBetCents] = useState<number>(10000); // 100 HTG
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([7, 14, 21]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnNumbers, setDrawnNumbers] = useState<number[] | null>(null);
  const [lastResult, setLastResult] = useState<{
    won: boolean;
    matches: number;
    multiplier: number;
    prizeCents: number;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
    const unsub = subscribeWalletSync((bal) => {
      if (typeof bal === "number") setBalanceCents(bal);
      else fetchBalance();
    });
    return () => unsub();
  }, []);

  const toggleNumber = (num: number) => {
    if (isDrawing) return;
    if (selectedNumbers.includes(num)) {
      setSelectedNumbers(selectedNumbers.filter((n) => n !== num));
    } else {
      if (selectedNumbers.length < 3) {
        setSelectedNumbers([...selectedNumbers, num].sort((a, b) => a - b));
      }
    }
  };

  const autoPick = () => {
    if (isDrawing) return;
    const picks = new Set<number>();
    while (picks.size < 3) {
      picks.add(Math.floor(Math.random() * 30) + 1);
    }
    setSelectedNumbers(Array.from(picks).sort((a, b) => a - b));
  };

  const drawLoto = async () => {
    if (isDrawing) return;
    if (selectedNumbers.length !== 3) {
      setErrorMsg("Veuillez sélectionner exactement 3 numéros.");
      return;
    }
    if (balanceCents < betCents) {
      setErrorMsg("Solde insuffisant dans votre portefeuille pour cette mise.");
      return;
    }

    setIsDrawing(true);
    setErrorMsg(null);
    setLastResult(null);
    setDrawnNumbers(null);

    try {
      const res = await fetch("/api/games/play", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameType: "LOTO",
          betCents,
          choice: selectedNumbers,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Erreur lors du tirage.");
        setIsDrawing(false);
        triggerWalletSync();
        return;
      }

      // Révélation progressive des 3 boules
      setTimeout(() => {
        setDrawnNumbers(data.outcomeData.drawnNumbers);
        setIsDrawing(false);
        setLastResult({
          won: data.won,
          matches: data.outcomeData.matches,
          multiplier: data.multiplier,
          prizeCents: data.prizeCents,
        });
        triggerWalletSync(data.newBalanceCents);
      }, 2000);
    } catch {
      setErrorMsg("Erreur réseau");
      setIsDrawing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-6 px-4">
      <div className="flex items-center justify-between">
        <Link
          href="/tickets"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Retour aux jeux
        </Link>
        <div className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Tirage Aléatoire Officiel</span>
        </div>
      </div>

      <div className="text-center space-y-2">
        <span className="text-xs font-bold text-amber-400 tracking-wider uppercase">Loterie Instantanée</span>
        <h1 className="text-3xl sm:text-4xl font-black text-white flex items-center justify-center gap-2">
          <Dices className="w-8 h-8 text-amber-400" /> Loto Minute (Tirage 3)
        </h1>
        <p className="text-xs sm:text-sm text-gray-400">
          Choisissez 3 numéros de chance entre 1 et 30. Décrochez jusqu'à <strong>50x votre mise</strong> !
        </p>
      </div>

      {/* Boules tirées */}
      <div className="p-6 bg-gradient-to-br from-indigo-950 via-gray-900 to-purple-950 border border-indigo-500/30 rounded-3xl text-center space-y-4 shadow-xl">
        <span className="text-xs font-bold text-indigo-300 uppercase tracking-widest">
          {isDrawing ? "TIRAGE EN COURS..." : drawnNumbers ? "NUMÉROS SORTIS AU TIRAGE" : "PRÊT POUR LE TIRAGE"}
        </span>

        <div className="flex justify-center items-center gap-4 py-2">
          {[0, 1, 2].map((idx) => {
            const num = drawnNumbers ? drawnNumbers[idx] : null;
            const isMatch = num && selectedNumbers.includes(num);

            return (
              <div
                key={idx}
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center font-black text-2xl sm:text-3xl shadow-xl transition-all duration-500 ${
                  isDrawing
                    ? "animate-bounce bg-amber-400 text-gray-950"
                    : num
                    ? isMatch
                      ? "bg-gradient-to-tr from-emerald-500 to-emerald-300 text-gray-950 border-4 border-emerald-200 ring-4 ring-emerald-500/40 scale-110"
                      : "bg-gradient-to-tr from-indigo-600 to-blue-400 text-white border-2 border-indigo-300"
                    : "bg-gray-800/80 border-2 border-dashed border-gray-600 text-gray-500"
                }`}
              >
                {isDrawing ? "?" : num || "?"}
              </div>
            );
          })}
        </div>

        {/* Tableau des gains Loto */}
        <div className="flex justify-center gap-4 text-[11px] text-gray-400 pt-2 border-t border-gray-800">
          <span>1 bon numéro : <strong className="text-amber-400">x1.5</strong></span>
          <span>2 bons numéros : <strong className="text-amber-400">x8</strong></span>
          <span>3 bons numéros : <strong className="text-amber-400">x50</strong></span>
        </div>
      </div>

      {/* Résultat */}
      {lastResult && (
        <div
          className={`p-4 rounded-2xl border text-center animate-in zoom-in-95 ${
            lastResult.won
              ? "bg-emerald-950/60 border-emerald-500/50 text-emerald-200"
              : "bg-gray-900/80 border-gray-800 text-gray-400"
          }`}
        >
          {lastResult.won ? (
            <div className="space-y-1">
              <span className="text-xs uppercase font-bold text-emerald-400">
                🎉 {lastResult.matches} NUMÉRO(S) GAGNANT(S) !
              </span>
              <div className="text-2xl font-black text-amber-300">
                +{formatCurrency(lastResult.prizeCents, "HTG", "fr")} (x{lastResult.multiplier})
              </div>
              <p className="text-xs text-emerald-400">Gain crédité immédiatement sur votre solde.</p>
            </div>
          ) : (
            <div>
              <p className="text-sm font-bold text-gray-300">Aucune correspondance cette fois !</p>
              <p className="text-xs text-gray-500">Relancez un tirage pour décrocher le x50.</p>
            </div>
          )}
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 text-center">
          {errorMsg}
        </div>
      )}

      {/* Grille de sélection des 30 numéros */}
      <div className="p-6 bg-gray-900/90 border border-gray-800 rounded-2xl space-y-4">
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-300 font-semibold">
            Vos 3 numéros choisis ({selectedNumbers.length}/3) :
          </span>
          <button
            disabled={isDrawing}
            onClick={autoPick}
            className="flex items-center gap-1 text-amber-400 hover:text-amber-300 font-bold"
          >
            <Shuffle className="w-3.5 h-3.5" /> Tirage Auto Chance
          </button>
        </div>

        <div className="grid grid-cols-6 sm:grid-cols-10 gap-2">
          {Array.from({ length: 30 }, (_, i) => i + 1).map((n) => {
            const isSelected = selectedNumbers.includes(n);
            return (
              <button
                key={n}
                disabled={isDrawing}
                onClick={() => toggleNumber(n)}
                className={`h-10 rounded-xl font-bold text-xs transition-all ${
                  isSelected
                    ? "bg-amber-400 text-gray-950 font-black shadow-lg scale-105"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
              >
                {n}
              </button>
            );
          })}
        </div>

        {/* Sélecteur de mise */}
        <div className="pt-4 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Mise :</span>
            {[5000, 10000, 20000, 50000].map((amt) => (
              <button
                key={amt}
                disabled={isDrawing}
                onClick={() => setBetCents(amt)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  betCents === amt ? "bg-amber-500 text-gray-950" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}
              >
                {amt / 100} HTG
              </button>
            ))}
          </div>

          <button
            disabled={isDrawing || selectedNumbers.length !== 3}
            onClick={drawLoto}
            className={`w-full sm:w-auto px-8 py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
              isDrawing || selectedNumbers.length !== 3
                ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                : "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 shadow-amber-500/20 active:scale-95"
            }`}
          >
            <Dices className={`w-4 h-4 ${isDrawing ? "animate-spin" : ""}`} />
            {isDrawing ? "Tirage..." : "Lancer le Tirage !"}
          </button>
        </div>
      </div>
    </div>
  );
}
