"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/i18n";
import { subscribeWalletSync } from "@/lib/wallet-sync";
import {
  Gamepad2,
  Trophy,
  Search,
  Flame,
  Sparkles,
  Ticket,
  Play,
  RotateCw,
  Coins,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

interface GameCard {
  id: string;
  title: string;
  category: "popular" | "keno" | "lucky6" | "scratch" | "instant";
  badge?: string;
  href: string;
  description: string;
  maxWin: string;
  bgGradient: string;
}

const GAMES_CATALOG: GameCard[] = [
  {
    id: "lucky-6",
    title: "LUCKY 6",
    category: "lucky6",
    badge: "LIVE 45s",
    href: "/games/lucky6",
    description: "48 boules multicolores. Complétez vos 6 numéros pour remporter jusqu'à x10 000 !",
    maxWin: "x10 000",
    bgGradient: "from-rose-950 via-red-900 to-rose-950",
  },
  {
    id: "keno-80",
    title: "KENO 80",
    category: "keno",
    badge: "POPULAIRE",
    href: "/games/keno",
    description: "Tirage rapide de 20 boules parmi 80 sur tapis vert casino officiel.",
    maxWin: "x50 000",
    bgGradient: "from-emerald-950 via-green-900 to-emerald-950",
  },
  {
    id: "scratch-100",
    title: "CHANS LAKAY 100",
    category: "scratch",
    badge: "GRATTAGE",
    href: "/tickets",
    description: "Le ticket classique populaire à 100 Gourdes. 3 symboles identiques pour gagner !",
    maxWin: "3 000 HTG",
    bgGradient: "from-amber-950 via-yellow-900 to-amber-950",
  },
  {
    id: "wheel-instant",
    title: "ROULETTE FORTUNE",
    category: "instant",
    badge: "INSTANT",
    href: "/games/wheel",
    description: "Faites tourner la roue et multipliez votre mise instantanément.",
    maxWin: "x10 mise",
    bgGradient: "from-indigo-950 via-purple-900 to-indigo-950",
  },
  {
    id: "coinflip-instant",
    title: "CRASH & COINFLIP",
    category: "instant",
    badge: "FLASH 2s",
    href: "/games/coinflip",
    description: "Doublez votre mise en 2 secondes en choisissant Pile ou Face (Kwa / Tèt).",
    maxWin: "x2 mise",
    bgGradient: "from-blue-950 via-sky-900 to-blue-950",
  },
  {
    id: "loto-minute",
    title: "LOTO MINUTE",
    category: "instant",
    badge: "TIRAGE",
    href: "/games/loto",
    description: "Tirage express de 3 numéros parmi 30 pour des gains réguliers.",
    maxWin: "x50 mise",
    bgGradient: "from-violet-950 via-indigo-900 to-violet-950",
  },
];

// Composant pour afficher les compteurs sous forme de cases de rouleaux digitaux (Modèle Image 3)
function JackpotOdometer({ label, value, color }: { label: string; value: string; color: "silver" | "gold" | "max" }) {
  const digits = value.padStart(6, "0").split("");

  return (
    <div className="flex flex-col items-center space-y-1">
      <span
        className={`text-[9px] sm:text-[10px] font-black uppercase tracking-wider ${
          color === "gold" ? "text-amber-400" : color === "silver" ? "text-gray-300" : "text-amber-500"
        }`}
      >
        {label}
      </span>

      <div className="flex items-center gap-0.5 sm:gap-1 bg-black/80 p-1 rounded-lg border border-[#1f2d47] shadow-inner">
        {digits.map((d, i) => (
          <span
            key={i}
            className={`w-4 h-6 sm:w-5 sm:h-7 rounded flex items-center justify-center font-mono font-black text-xs sm:text-sm border ${
              color === "gold"
                ? "text-yellow-400 border-yellow-500/40 bg-gradient-to-b from-yellow-950/40 to-black"
                : color === "silver"
                ? "text-gray-200 border-gray-500/40 bg-gradient-to-b from-gray-900 to-black"
                : "text-amber-400 border-amber-600/40 bg-gradient-to-b from-amber-950/40 to-black"
            }`}
          >
            {d}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function GamesHubPage() {
  const [balanceCents, setBalanceCents] = useState<number>(0);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

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

  const filteredGames = GAMES_CATALOG.filter((game) => {
    if (selectedCategory !== "all" && game.category !== selectedCategory) {
      return false;
    }
    if (searchQuery.trim() && !game.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-4 pb-20">
      {/* 1. Bannière Principale Slots & Games (Modèle officiel Image 3) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0d1627] via-[#101e38] to-[#142340] border border-[#1b2b48] p-4 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
          <div className="space-y-1">
            <span className="text-[10px] bg-red-600 text-white font-black px-2 py-0.5 rounded uppercase">
              1 CAR • 11 MOTORCYCLES • HTG 1.8M CASH
            </span>
            <h1 className="text-xl sm:text-3xl font-black text-white leading-tight">
              SLOTS, KENO, LUCKY 6 & GRATTAGE
            </h1>
            <p className="text-xs text-gray-300">
              Découvrez la plus grande sélection de jeux instantanés en Haïti.
            </p>
          </div>

          <Link
            href="/games/lucky6"
            className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-gray-950 font-black text-xs rounded-xl shadow-lg transition-all self-start sm:self-center uppercase tracking-wider"
          >
            Lancer Lucky 6
          </Link>
        </div>
      </div>

      {/* 2. Les 3 Jackpots Odomètre Digitaux (Modèle officiel Image 3) */}
      <div className="grid grid-cols-3 gap-2 bg-[#0c1424] border border-[#18263e] rounded-2xl p-3 shadow-lg">
        <JackpotOdometer label="SILVER JACKPOT" value="006159" color="silver" />
        <JackpotOdometer label="GOLD JACKPOT" value="058646" color="gold" />
        <JackpotOdometer label="MAXIMUM JACKPOT" value="020590" color="max" />
      </div>

      {/* 3. Onglets de Catégories (Modèle officiel Image 3 avec barre jaune) */}
      <div className="flex items-center gap-4 overflow-x-auto pb-1.5 border-b border-gray-800 scrollbar-none text-xs">
        {[
          { id: "all", label: "All" },
          { id: "popular", label: "Popular" },
          { id: "lucky6", label: "Lucky 6" },
          { id: "keno", label: "Keno 80" },
          { id: "scratch", label: "Grattage" },
          { id: "instant", label: "Instant" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedCategory(tab.id)}
            className={`font-black pb-1.5 whitespace-nowrap transition-all ${
              selectedCategory === tab.id
                ? "text-amber-400 border-b-2 border-amber-400"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 4. Barre de Recherche */}
      <div className="relative">
        <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search game"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#0c1424] border border-[#18263e] rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-white placeholder-gray-500 focus:border-amber-400 focus:outline-none"
        />
      </div>

      {/* 5. Section "Popular" (Grandes Cartes Verticales comme Image 3) */}
      <div className="space-y-3">
        <h2 className="text-sm font-black text-white uppercase tracking-wider">
          Popular Games
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {filteredGames.map((game) => (
            <Link
              key={game.id}
              href={game.href}
              className={`rounded-2xl bg-gradient-to-b ${game.bgGradient} border border-[#1b2b48] hover:border-amber-400/60 p-3 flex flex-col justify-between min-h-[190px] shadow-lg group hover:scale-102 transition-all duration-300`}
            >
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-black/60 text-amber-400 border border-amber-500/30">
                    {game.badge}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-gray-300">
                    {game.maxWin}
                  </span>
                </div>

                <div className="h-20 flex items-center justify-center">
                  {game.category === "lucky6" ? (
                    <div className="w-14 h-14 rounded-full bg-red-600 text-white font-black text-2xl flex items-center justify-center shadow-2xl ring-4 ring-yellow-400 animate-pulse">
                      6
                    </div>
                  ) : game.category === "keno" ? (
                    <div className="w-14 h-14 rounded-full bg-emerald-600 text-white font-black text-2xl flex items-center justify-center shadow-2xl ring-4 ring-emerald-300">
                      80
                    </div>
                  ) : (
                    <Ticket className="w-12 h-12 text-amber-300" />
                  )}
                </div>

                <h3 className="text-center font-black text-white text-xs sm:text-sm uppercase tracking-wide">
                  {game.title}
                </h3>
              </div>

              <div className="pt-2 border-t border-black/30 flex items-center justify-center">
                <span className="w-full py-1.5 bg-amber-400 group-hover:bg-amber-300 text-gray-950 font-black rounded-lg text-xs text-center uppercase tracking-wider shadow">
                  Play now
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
