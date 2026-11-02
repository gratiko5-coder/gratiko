"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/i18n";
import { triggerWalletSync, subscribeWalletSync } from "@/lib/wallet-sync";
import { ArrowLeft, Coins, ShieldCheck, Sparkles } from "lucide-react";

export default function CoinFlipPage() {
  const [balanceCents, setBalanceCents] = useState<number>(0);
  const [betCents, setBetCents] = useState<number>(10000); // 100 HTG
  const [selectedSide, setSelectedSide] = useState<"HEADS" | "TAILS">("HEADS");
  const [isFlipping, setIsFlipping] = useState(false);
  const [resultSide, setResultSide] = useState<"HEADS" | "TAILS" | null>(null);
  const [lastResult, setLastResult] = useState<{
    won: boolean;
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

  const flipCoin = async () => {
    if (isFlipping) return;
    if (balanceCents < betCents) {
      setErrorMsg("Solde insuffisant dans votre portefeuille pour cette mise.");
      return;
    }

    setIsFlipping(true);
    setErrorMsg(null);
    setLastResult(null);
    setResultSide(null);

    try {
      const res = await fetch("/api/games/play", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameType: "COINFLIP",
          betCents,
          choice: selectedSide,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Erreur de jeu.");
        setIsFlipping(false);
        triggerWalletSync();
        return;
      }

      // Animation du lancer pendant 2.5 secondes
      setTimeout(() => {
        setResultSide(data.outcomeData.resultSide);
        setIsFlipping(false);
        setLastResult({
          won: data.won,
          prizeCents: data.prizeCents,
        });
        triggerWalletSync(data.newBalanceCents);
      }, 2500);
    } catch {
      setErrorMsg("Erreur réseau");
      setIsFlipping(false);
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
          <span>Équité Vérifiée Côté Serveur</span>
        </div>
      </div>

      <div className="text-center space-y-2">
        <span className="text-xs font-bold text-amber-400 tracking-wider uppercase">Jeu Instantané Flash</span>
        <h1 className="text-3xl sm:text-4xl font-black text-white flex items-center justify-center gap-2">
          <Coins className="w-8 h-8 text-amber-400" /> Chans Doub (Pile ou Face)
        </h1>
        <p className="text-xs sm:text-sm text-gray-400">
          Choisissez <strong>Tèt (Face)</strong> ou <strong>Kwa (Pile)</strong> et doublez votre mise instantanément (x2) !
        </p>
      </div>

      {/* Pièce de monnaie 3D interactive */}
      <div className="flex flex-col items-center justify-center py-8">
        <div
          className={`w-40 h-40 rounded-full border-4 border-amber-300 bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-200 shadow-2xl shadow-amber-500/30 flex items-center justify-center text-gray-950 font-black text-2xl transition-all duration-700 select-none ${
            isFlipping ? "animate-spin scale-110" : "scale-100"
          }`}
        >
          <div className="w-32 h-32 rounded-full border-2 border-dashed border-amber-800 flex flex-col items-center justify-center bg-amber-400/80">
            <span className="text-xs font-bold tracking-widest uppercase text-amber-950">GRATIKO</span>
            <span className="text-3xl">
              {resultSide === "HEADS" ? "👑" : resultSide === "TAILS" ? "⚡" : selectedSide === "HEADS" ? "👑" : "⚡"}
            </span>
            <span className="text-xs font-black text-amber-900">
              {resultSide ? (resultSide === "HEADS" ? "TÈT (FACE)" : "KWA (PILE)") : (selectedSide === "HEADS" ? "TÈT" : "KWA")}
            </span>
          </div>
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
              <span className="text-xs uppercase font-bold text-emerald-400">🎉 GAGNÉ ! DOUBLEZ LA MISE !</span>
              <div className="text-2xl font-black text-amber-300">
                +{formatCurrency(lastResult.prizeCents, "HTG", "fr")} (x2)
              </div>
              <p className="text-xs text-emerald-400">Gain crédité immédiatement sur votre solde.</p>
            </div>
          ) : (
            <div>
              <p className="text-sm font-bold text-gray-300">C'est tombé sur {resultSide === "HEADS" ? "Tèt" : "Kwa"} !</p>
              <p className="text-xs text-gray-500">Pas de panique, relancez pour tenter le doublé.</p>
            </div>
          )}
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 text-center">
          {errorMsg}
        </div>
      )}

      {/* Sélection Côté (Tèt ou Kwa) */}
      <div className="grid grid-cols-2 gap-4">
        <button
          disabled={isFlipping}
          onClick={() => setSelectedSide("HEADS")}
          className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all ${
            selectedSide === "HEADS"
              ? "bg-amber-500/20 border-amber-400 text-white shadow-lg shadow-amber-500/10 scale-102"
              : "bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-700"
          }`}
        >
          <span className="text-3xl">👑</span>
          <span className="font-bold text-sm">Tèt (Face)</span>
          <span className="text-[11px] text-amber-400 font-mono">Multiplicateur x2</span>
        </button>

        <button
          disabled={isFlipping}
          onClick={() => setSelectedSide("TAILS")}
          className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all ${
            selectedSide === "TAILS"
              ? "bg-amber-500/20 border-amber-400 text-white shadow-lg shadow-amber-500/10 scale-102"
              : "bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-700"
          }`}
        >
          <span className="text-3xl">⚡</span>
          <span className="font-bold text-sm">Kwa (Pile)</span>
          <span className="text-[11px] text-amber-400 font-mono">Multiplicateur x2</span>
        </button>
      </div>

      {/* Sélecteur de mise */}
      <div className="p-6 bg-gray-900/90 border border-gray-800 rounded-2xl space-y-4">
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-400">Choisir votre mise :</span>
          <span className="font-bold text-amber-400 font-mono text-sm">
            {formatCurrency(betCents, "HTG", "fr")}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {[5000, 10000, 20000, 50000].map((amount) => (
            <button
              key={amount}
              disabled={isFlipping}
              onClick={() => setBetCents(amount)}
              className={`py-2 px-1 rounded-xl font-bold text-xs transition-all ${
                betCents === amount
                  ? "bg-amber-500 text-gray-950 shadow-md scale-105"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              {amount / 100} HTG
            </button>
          ))}
        </div>

        <button
          disabled={isFlipping}
          onClick={flipCoin}
          className={`w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2 transition-all shadow-lg ${
            isFlipping
              ? "bg-gray-800 text-gray-500 cursor-not-allowed"
              : "bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 shadow-amber-500/20 active:scale-95"
          }`}
        >
          <Coins className={`w-5 h-5 ${isFlipping ? "animate-spin" : ""}`} />
          {isFlipping ? "La pièce vole dans les airs..." : "Lancer la Pièce !"}
        </button>
      </div>
    </div>
  );
}
