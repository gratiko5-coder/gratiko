"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/i18n";
import { triggerWalletSync, subscribeWalletSync } from "@/lib/wallet-sync";
import { ArrowLeft, Sparkles, Trophy, RotateCw, ShieldCheck, Flame } from "lucide-react";

const SEGMENTS = [
  { label: "0x Perdu", multiplier: 0, color: "#1e1b4b", text: "#94a3b8" },
  { label: "1x Remboursé", multiplier: 1, color: "#065f46", text: "#34d399" },
  { label: "1.5x Gain", multiplier: 1.5, color: "#1e3a8a", text: "#60a5fa" },
  { label: "2x Gain", multiplier: 2, color: "#854d0e", text: "#fde047" },
  { label: "3x Bonus", multiplier: 3, color: "#9a3412", text: "#fb923c" },
  { label: "5x Méga", multiplier: 5, color: "#831843", text: "#f472b6" },
  { label: "10x JACKPOT", multiplier: 10, color: "#701a75", text: "#e879f9" },
];

export default function WheelGamePage() {
  const [balanceCents, setBalanceCents] = useState<number>(0);
  const [betCents, setBetCents] = useState<number>(10000); // 100 HTG par défaut
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentAngle, setCurrentAngle] = useState(0);
  const [lastResult, setLastResult] = useState<{
    won: boolean;
    multiplier: number;
    prizeCents: number;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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

  // Dessin de la Roue
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = canvas.width;
    const center = size / 2;
    const radius = center - 16;
    const numSegments = SEGMENTS.length;
    const anglePerSegment = (2 * Math.PI) / numSegments;

    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.translate(center, center);
    ctx.rotate((currentAngle * Math.PI) / 180);

    // Dessiner chaque segment
    for (let i = 0; i < numSegments; i++) {
      const segAngle = i * anglePerSegment;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, segAngle, segAngle + anglePerSegment);
      ctx.closePath();
      ctx.fillStyle = SEGMENTS[i].color;
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#0f172a";
      ctx.stroke();

      // Texte du segment
      ctx.save();
      ctx.rotate(segAngle + anglePerSegment / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = SEGMENTS[i].text;
      ctx.font = "bold 13px Inter, sans-serif";
      ctx.fillText(SEGMENTS[i].label, radius - 20, 5);
      ctx.restore();
    }

    // Cercle central doré
    ctx.beginPath();
    ctx.arc(0, 0, 36, 0, 2 * Math.PI);
    ctx.fillStyle = "#eab308";
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#78350f";
    ctx.stroke();

    ctx.restore();

    // Bordure extérieure décorative
    ctx.beginPath();
    ctx.arc(center, center, radius + 4, 0, 2 * Math.PI);
    ctx.lineWidth = 8;
    ctx.strokeStyle = "rgba(234, 179, 8, 0.4)";
    ctx.stroke();
  }, [currentAngle]);

  const spinWheel = async () => {
    if (isSpinning) return;
    if (balanceCents < betCents) {
      setErrorMsg("Solde insuffisant dans votre portefeuille pour cette mise.");
      return;
    }

    setIsSpinning(true);
    setErrorMsg(null);
    setLastResult(null);

    try {
      const res = await fetch("/api/games/play", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameType: "WHEEL",
          betCents,
          choice: "SPIN",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Erreur de jeu.");
        setIsSpinning(false);
        triggerWalletSync();
        return;
      }

      // Calculer l'angle d'arrêt
      const segmentIndex = data.outcomeData.segmentIndex;
      const numSegments = SEGMENTS.length;
      const anglePerSegment = 360 / numSegments;
      // Le curseur pointe vers le haut (270 degrés)
      const targetSegmentCenter = segmentIndex * anglePerSegment + anglePerSegment / 2;
      const finalRotation = 360 * 5 + (270 - targetSegmentCenter);

      const startTime = performance.now();
      const duration = 4000;
      const startAngle = currentAngle % 360;

      const animate = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Easing cubique de décélération
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const newAngle = startAngle + finalRotation * easeOut;
        setCurrentAngle(newAngle);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setIsSpinning(false);
          setLastResult({
            won: data.won,
            multiplier: data.multiplier,
            prizeCents: data.prizeCents,
          });
          triggerWalletSync(data.newBalanceCents);
        }
      };

      requestAnimationFrame(animate);
    } catch {
      setErrorMsg("Erreur réseau");
      setIsSpinning(false);
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
          <span>Tirage Scellé Cryptographique</span>
        </div>
      </div>

      <div className="text-center space-y-2">
        <span className="text-xs font-bold text-amber-400 tracking-wider uppercase">Jeu Instantané</span>
        <h1 className="text-3xl sm:text-4xl font-black text-white flex items-center justify-center gap-2">
          <Flame className="w-8 h-8 text-amber-400" /> Roue de la Fortune Flash
        </h1>
        <p className="text-xs sm:text-sm text-gray-400">
          Faites tourner la roue d'or et remportez jusqu'à <strong>10x votre mise</strong> en direct !
        </p>
      </div>

      {/* Roue Animée */}
      <div className="relative flex flex-col items-center justify-center py-4">
        {/* Curseur pointeur */}
        <div className="z-20 w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[24px] border-t-amber-400 drop-shadow-[0_4px_12px_rgba(234,179,8,0.8)] -mb-3" />

        <div className="p-3 bg-gradient-to-b from-gray-900 to-gray-950 rounded-full border-4 border-amber-500/40 shadow-2xl shadow-amber-500/10">
          <canvas ref={canvasRef} width={340} height={340} className="w-[300px] h-[300px] sm:w-[340px] sm:h-[340px]" />
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
              <span className="text-xs uppercase font-bold text-emerald-400">🎉 FÉLICITATIONS !</span>
              <div className="text-2xl font-black text-amber-300">
                +{formatCurrency(lastResult.prizeCents, "HTG", "fr")} (x{lastResult.multiplier})
              </div>
              <p className="text-xs text-emerald-400">Gain crédité immédiatement sur votre solde.</p>
            </div>
          ) : (
            <div>
              <p className="text-sm font-bold text-gray-300">Pas de chance cette fois !</p>
              <p className="text-xs text-gray-500">Tentez à nouveau votre chance.</p>
            </div>
          )}
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 text-center">
          {errorMsg}
        </div>
      )}

      {/* Sélecteur de mise */}
      <div className="p-6 bg-gray-900/90 border border-gray-800 rounded-2xl space-y-4">
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-400">Choisir votre mise :</span>
          <span className="font-bold text-amber-400 font-mono text-sm">
            {formatCurrency(betCents, "HTG", "fr")}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {[5000, 10000, 25000, 50000].map((amount) => (
            <button
              key={amount}
              disabled={isSpinning}
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
          disabled={isSpinning}
          onClick={spinWheel}
          className={`w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2 transition-all shadow-lg ${
            isSpinning
              ? "bg-gray-800 text-gray-500 cursor-not-allowed"
              : "bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 shadow-amber-500/20 active:scale-95"
          }`}
        >
          <RotateCw className={`w-5 h-5 ${isSpinning ? "animate-spin" : ""}`} />
          {isSpinning ? "La roue tourne..." : "Faire Tourner la Roue !"}
        </button>
      </div>
    </div>
  );
}
