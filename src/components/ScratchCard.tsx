"use client";

import React, { useRef, useEffect, useState } from "react";
import { formatCurrency, Translations } from "@/lib/i18n";
import { Sparkles, Trophy, Frown, CheckCircle } from "lucide-react";
import { triggerWalletSync } from "@/lib/wallet-sync";

interface ScratchCardProps {
  ticket: {
    id: string;
    ticketNumber: string;
    priceCents: number;
    currency: string;
    isWinner: boolean;
    prizeAmountCents: number;
    tierName: string;
    symbolsPattern: string; // JSON array of 9 symbols
    status: string;
    ticketType: {
      name: string;
      visualTheme: string;
      rulesText: string;
    };
  };
  t: Translations;
  locale: string;
  onRevealed?: (ticket: any) => void;
}

export default function ScratchCard({ ticket, t, locale, onRevealed }: ScratchCardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isScratched, setIsScratched] = useState(ticket.status === "CLAIMED" || ticket.status === "SCRATCHED");
  const [isRevealing, setIsRevealing] = useState(false);
  const [claimStatus, setClaimStatus] = useState<"idle" | "claiming" | "claimed">("idle");
  const isDrawing = useRef(false);

  const symbols: string[] = React.useMemo(() => {
    try {
      return JSON.parse(ticket.symbolsPattern);
    } catch {
      return ["⭐", "⭐", "⭐", "🍒", "🍋", "🔔", "🍇", "🍉", "🪙"];
    }
  }, [ticket.symbolsPattern]);

  useEffect(() => {
    if (isScratched) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Dimensions
    const width = canvas.width;
    const height = canvas.height;

    // Dégradé luxueux argenté/doré pour la surface à gratter
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#c0c0c0");
    gradient.addColorStop(0.3, "#e6e6e6");
    gradient.addColorStop(0.5, "#d4af37");
    gradient.addColorStop(0.7, "#f3f4f6");
    gradient.addColorStop(1, "#9ca3af");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Dessin du motif GRATIKO et instructions sur la surface
    const logoImg = new Image();
    logoImg.src = "/logo.png";
    logoImg.onload = () => {
      const c = canvasRef.current?.getContext("2d");
      if (c && !isScratched) {
        const aspect = logoImg.width / logoImg.height;
        const targetH = 45;
        const targetW = Math.min(180, targetH * aspect);
        c.drawImage(logoImg, (width - targetW) / 2, height / 2 - 35, targetW, targetH);
      }
    };

    ctx.fillStyle = "#4338ca";
    ctx.font = "bold 13px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(t.tickets.scratchPrompt, width / 2, height / 2 + 25);

    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, width - 20, height - 20);
  }, [isScratched, t]);

  const handleScratch = (clientX: number, clientY: number) => {
    if (isScratched) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;

    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, 28, 0, Math.PI * 2);
    ctx.fill();

    checkScratchPercentage(canvas, ctx);
  };

  const checkScratchPercentage = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
    try {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      let transparentCount = 0;
      const sampleStep = 32; // Échantillonnage pour performance fluide

      for (let i = 3; i < data.length; i += sampleStep) {
        if (data[i] === 0) {
          transparentCount++;
        }
      }

      const totalSamples = data.length / sampleStep;
      const percentage = (transparentCount / totalSamples) * 100;

      if (percentage > 50) {
        revealComplete();
      }
    } catch {
      // Tolérance si lecture de canvas bloquée
    }
  };

  const revealComplete = async () => {
    if (isScratched || isRevealing) return;
    setIsRevealing(true);

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }

    setIsScratched(true);
    setIsRevealing(false);

    // Réclamer le résultat auprès du serveur
    setClaimStatus("claiming");
    try {
      const res = await fetch("/api/tickets/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId: ticket.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setClaimStatus("claimed");
        if (typeof data.newBalanceCents === "number") {
          triggerWalletSync(data.newBalanceCents);
        } else {
          triggerWalletSync();
        }
        if (onRevealed) onRevealed(data.ticket);
      }
    } catch {
      setClaimStatus("idle");
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-gradient-to-br from-gray-900 via-indigo-950 to-slate-900 rounded-3xl p-6 shadow-2xl border border-indigo-500/30 text-white">
      {/* En-tête du Ticket */}
      <div className="flex justify-between items-center border-b border-indigo-800/50 pb-4 mb-4 gap-2">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="GRATIKO" className="h-10 w-auto object-contain shrink-0" />
          <div>
            <h2 className="text-xl font-black tracking-tight text-white">{ticket.ticketType.name}</h2>
            <p className="text-[11px] text-gray-400 font-mono">N° {ticket.ticketNumber}</p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-xs text-gray-400">{t.tickets.ticketPrice}</div>
          <div className="text-lg font-bold text-amber-400">
            {formatCurrency(ticket.priceCents, ticket.currency, locale)}
          </div>
        </div>
      </div>

      {/* Surface de Grattage avec Grille 3x3 */}
      <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-gradient-to-b from-indigo-950 to-black border-2 border-amber-500/40 shadow-inner flex items-center justify-center">
        {/* Grille des symboles en dessous (3x3) */}
        <div className="grid grid-cols-3 grid-rows-3 w-full h-full p-3 gap-2">
          {symbols.map((symbol, idx) => (
            <div
              key={idx}
              className="bg-indigo-900/60 rounded-xl border border-indigo-400/20 flex flex-col items-center justify-center p-2 shadow-md hover:scale-105 transition-transform"
            >
              <span className="text-3xl filter drop-shadow">{symbol}</span>
            </div>
          ))}
        </div>

        {/* Canvas de recouvrement à gratter */}
        {!isScratched && (
          <canvas
            ref={canvasRef}
            width={400}
            height={300}
            className="absolute inset-0 w-full h-full cursor-crosshair scratch-container"
            onMouseDown={() => (isDrawing.current = true)}
            onMouseUp={() => (isDrawing.current = false)}
            onMouseLeave={() => (isDrawing.current = false)}
            onMouseMove={(e) => {
              if (isDrawing.current) handleScratch(e.clientX, e.clientY);
            }}
            onTouchStart={() => (isDrawing.current = true)}
            onTouchEnd={() => (isDrawing.current = false)}
            onTouchMove={(e) => {
              if (isDrawing.current && e.touches[0]) {
                handleScratch(e.touches[0].clientX, e.touches[0].clientY);
              }
            }}
          />
        )}
      </div>

      {/* Résultat Révélé */}
      {isScratched && (
        <div className="mt-5 p-4 rounded-2xl bg-indigo-900/40 border border-indigo-500/40 text-center animate-fade-in">
          {ticket.isWinner ? (
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full text-xs font-bold uppercase tracking-wider">
                <Trophy className="w-4 h-4 text-amber-400" />
                {t.tickets.congratulations}
              </div>
              <div className="text-3xl font-black text-amber-400">
                + {formatCurrency(ticket.prizeAmountCents, ticket.currency, locale)}
              </div>
              <p className="text-xs text-emerald-400 flex items-center justify-center gap-1">
                <CheckCircle className="w-4 h-4" />
                Gain scellé par le serveur et crédité sur votre portefeuille
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 text-gray-400 text-sm font-medium">
                <Frown className="w-5 h-5 text-gray-400" />
                {t.tickets.sorryLose}
              </div>
              <p className="text-xs text-gray-500">Tentez votre chance sur un autre ticket !</p>
            </div>
          )}
        </div>
      )}

      {/* Bouton d'accessibilité: Révéler automatiquement */}
      {!isScratched && (
        <div className="mt-4 flex flex-col gap-2">
          <button
            onClick={revealComplete}
            disabled={isRevealing}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm"
          >
            <Sparkles className="w-4 h-4" />
            {isRevealing ? t.common.loading : t.tickets.autoScratch}
          </button>
          <p className="text-center text-[11px] text-gray-400">
            {t.tickets.rulesTitle} : {ticket.ticketType.rulesText}
          </p>
        </div>
      )}
    </div>
  );
}
