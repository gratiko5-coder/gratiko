"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

export default function JackpotTickerBanner() {
  const pathname = usePathname();

  // Masquer automatiquement le système de jackpot dès que l'utilisateur est dans les jeux
  // (Lobby /games, Lucky 6, Keno 80, Roue de la fortune, Pile ou face, Loto minute, Grattage de ticket)
  const isInsideGame =
    pathname.startsWith("/games") ||
    pathname.startsWith("/tickets");

  const [jackpots, setJackpots] = useState<{
    silver: number;
    gold: number;
    maximum: number;
  }>({
    silver: 6565,
    gold: 59234,
    maximum: 20744,
  });

  // Récupération des vraies données en direct depuis la base Supabase
  useEffect(() => {
    if (isInsideGame) return;

    const fetchJackpots = async () => {
      try {
        const res = await fetch("/api/jackpots", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data.jackpots) {
            setJackpots({
              silver: data.jackpots.silver,
              gold: data.jackpots.gold,
              maximum: data.jackpots.maximum,
            });
          }
        }
      } catch (err) {
        console.error("Erreur récupération jackpots réels:", err);
      }
    };

    fetchJackpots();

    // Actualisation automatique toutes les 8 secondes pour suivre les mises des joueurs
    const timer = setInterval(fetchJackpots, 8000);
    return () => clearInterval(timer);
  }, [isInsideGame]);

  // Si l'utilisateur est dans un jeu actif, ne rien afficher pour lui laisser tout l'écran
  if (isInsideGame) {
    return null;
  }

  // Rendu des 6 rouleaux digitaux (exactement comme sur l'Image 2)
  // Les zéros non significatifs au début sont affichés sous forme de cases sombres vides
  const renderOdometerReels = (amount: number) => {
    const str = amount.toString().padStart(6, " ");
    const chars = str.split("");

    return (
      <div className="relative inline-flex items-center justify-center gap-0.5 sm:gap-1 bg-black/90 px-1.5 sm:px-2 py-1 rounded-full border-2 border-yellow-400 shadow-[0_0_14px_rgba(250,204,21,0.7)] transition-all">
        {chars.map((ch, idx) => {
          const isBlank = ch === " ";
          return (
            <div
              key={idx}
              className={`w-3.5 sm:w-5 h-5 sm:h-7 rounded flex items-center justify-center font-mono font-black text-xs sm:text-base border transition-all ${
                isBlank
                  ? "bg-black/80 border-[#1f2d47] text-transparent"
                  : "bg-gradient-to-b from-[#181a20] via-black to-[#0e1015] border-yellow-500/40 text-yellow-400 shadow-sm"
              }`}
            >
              {!isBlank ? ch : ""}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full bg-[#0a1120] border-y border-[#18263e] py-2 px-2 shadow-lg animate-in fade-in">
      <div className="max-w-7xl mx-auto grid grid-cols-3 gap-1.5 sm:gap-4 text-center items-center">
        {/* 1. SILVER JACKPOT */}
        <div className="flex flex-col items-center space-y-1">
          <span className="text-[8px] sm:text-xs font-black italic tracking-wider text-white uppercase drop-shadow">
            SILVER JACKPOT
          </span>
          {renderOdometerReels(jackpots.silver)}
        </div>

        {/* 2. GOLD JACKPOT */}
        <div className="flex flex-col items-center space-y-1">
          <span className="text-[8px] sm:text-xs font-black italic tracking-wider text-white uppercase drop-shadow">
            GOLD JACKPOT
          </span>
          {renderOdometerReels(jackpots.gold)}
        </div>

        {/* 3. MAXIMUM JACKPOT */}
        <div className="flex flex-col items-center space-y-1">
          <span className="text-[8px] sm:text-xs font-black italic tracking-wider text-white uppercase drop-shadow">
            MAXIMUM JACKPOT
          </span>
          {renderOdometerReels(jackpots.maximum)}
        </div>
      </div>
    </div>
  );
}
