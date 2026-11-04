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
  category: "keno" | "lucky6" | "scratch" | "instant";
  badge?: string;
  image: string;
  href: string;
  description: string;
  maxWin: string;
}

const GAMES_CATALOG: GameCard[] = [
  {
    id: "keno-80",
    title: "KENO 80",
    category: "keno",
    badge: "POPULAIRE",
    image: "/games/keno.jpg",
    href: "/games/keno",
    description: "Tirage de 20 boules parmi 80. Choisissez vos numéros porte-bonheur.",
    maxWin: "Jusqu'à 50 000x",
  },
  {
    id: "lucky-6",
    title: "LUCKY 6",
    category: "lucky6",
    badge: "LIVE 45s",
    image: "/games/lucky6.jpg",
    href: "/games/lucky6",
    description: "48 boules multicolores. 6 numéros gagnants à compléter avant la 35e boule !",
    maxWin: "Jusqu'à 10 000x",
  },
  {
    id: "scratch-100",
    title: "Chans Lakay 100",
    category: "scratch",
    badge: "GRATTEZ",
    image: "/games/scratch100.jpg",
    href: "/tickets",
    description: "Le ticket classique populaire à 100 Gourdes. 3 symboles identiques pour gagner !",
    maxWin: "3 000 HTG",
  },
  {
    id: "scratch-250",
    title: "Gwo Lòt 250",
    category: "scratch",
    badge: "JACKPOT",
    image: "/games/scratch250.jpg",
    href: "/tickets",
    description: "Ticket intermédiaire à fort potentiel de gains pour les joueurs assidus.",
    maxWin: "15 000 HTG",
  },
  {
    id: "scratch-500",
    title: "Millionnaire 500",
    category: "scratch",
    badge: "SUPER CASH",
    image: "/games/scratch500.jpg",
    href: "/tickets",
    description: "Le grand ticket VIP. Tentez votre chance pour décrocher la cagnotte maximale.",
    maxWin: "50 000 HTG",
  },
  {
    id: "wheel-instant",
    title: "Roue de la Fortune",
    category: "instant",
    badge: "INSTANT",
    image: "/games/wheel.jpg",
    href: "/games/wheel",
    description: "Faites tourner la roue festive et multipliez votre mise instantanément.",
    maxWin: "x10 votre mise",
  },
  {
    id: "coinflip-instant",
    title: "Pile ou Face (Kwa/Tèt)",
    category: "instant",
    badge: "FLASH",
    image: "/games/coinflip.jpg",
    href: "/games/coinflip",
    description: "Un classique rapide : choisissez Kwa ou Tèt pour doubler votre mise en 2 secondes.",
    maxWin: "x2 votre mise",
  },
  {
    id: "loto-minute",
    title: "Loto Minute 3 Boules",
    category: "instant",
    badge: "TIRAGE",
    image: "/games/loto.jpg",
    href: "/games/loto",
    description: "Tirage express de 3 numéros parmi 30 pour des gains rapides et réguliers.",
    maxWin: "x50 votre mise",
  },
];

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
    <div className="max-w-7xl mx-auto py-4 sm:py-6 space-y-6 px-3 sm:px-6 pb-28">
      {/* 1. Bannière Principale Slots & Games (Modèle Panel 2) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-700 p-6 sm:p-8 shadow-2xl text-gray-950 border border-amber-300">
        <div className="absolute top-0 right-0 -mr-12 -mt-12 w-64 h-64 bg-white/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <span className="text-[11px] font-black uppercase tracking-wider bg-gray-950 text-amber-400 px-3 py-1 rounded-full inline-block shadow">
              PROMO DU MOIS
            </span>
            <h1 className="text-2xl sm:text-4xl font-black leading-tight tracking-tight">
              2 500 000 HTG SLOTS & GAMES DRAW !
            </h1>
            <p className="text-xs sm:text-sm font-bold text-gray-900 max-w-xl">
              Jouez au Keno 80, Lucky 6, Grattage et Jeux Instantanés pour accumuler des points et remporter la super cagnotte !
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/games/keno"
              className="px-5 py-3 bg-gray-950 hover:bg-black text-amber-400 font-black text-xs sm:text-sm rounded-2xl shadow-xl transition-all flex items-center gap-2 active:scale-95"
            >
              <span>JOUER AU KENO 80</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Jackpots Tickers Animés (Silver, Gold, Max comme sur Panel 2) */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className="bg-gradient-to-b from-gray-900 via-gray-950 to-black border border-gray-800 rounded-2xl p-3 sm:p-4 text-center shadow-lg">
          <p className="text-[9px] sm:text-[11px] font-black uppercase text-gray-400 tracking-wider">
            SILVER JACKPOT
          </p>
          <p className="text-sm sm:text-xl font-black font-mono text-amber-300 mt-1">
            15 744,00 HTG
          </p>
        </div>

        <div className="bg-gradient-to-b from-amber-950/60 via-gray-950 to-black border border-amber-500/50 rounded-2xl p-3 sm:p-4 text-center shadow-xl">
          <p className="text-[9px] sm:text-[11px] font-black uppercase text-amber-400 tracking-wider flex items-center justify-center gap-1">
            <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" /> GOLD JACKPOT
          </p>
          <p className="text-base sm:text-2xl font-black font-mono text-amber-400 mt-1">
            11 583,00 HTG
          </p>
        </div>

        <div className="bg-gradient-to-b from-emerald-950/60 via-gray-950 to-black border border-emerald-500/40 rounded-2xl p-3 sm:p-4 text-center shadow-lg">
          <p className="text-[9px] sm:text-[11px] font-black uppercase text-emerald-400 tracking-wider">
            MAXIMUM JACKPOT
          </p>
          <p className="text-sm sm:text-xl font-black font-mono text-emerald-300 mt-1">
            8 214,00 HTG
          </p>
        </div>
      </div>

      {/* 3. Onglets de Catégories Horizontaux (Modèle Panel 2) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: "all", label: "Tous les Jeux" },
          { id: "keno", label: "Keno 80" },
          { id: "lucky6", label: "Lucky 6" },
          { id: "scratch", label: "Tickets Grattage" },
          { id: "instant", label: "Jeux Instantanés" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedCategory(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === tab.id
                ? "bg-amber-500 text-gray-950 font-black shadow-md"
                : "bg-gray-900 text-gray-400 hover:text-white border border-gray-800"
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
          placeholder="Rechercher un jeu (Keno, Lucky 6, Grattage...)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-gray-900 border border-gray-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-gray-500 focus:border-amber-400 focus:outline-none"
        />
      </div>

      {/* 5. Grille des Cartes de Jeux (Modèle Panel 2 & 6) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {filteredGames.map((game) => (
          <Link
            key={game.id}
            href={game.href}
            className="group rounded-2xl bg-gradient-to-b from-gray-900 to-gray-950 border border-gray-800 hover:border-amber-500/50 p-3 sm:p-4 transition-all duration-300 flex flex-col justify-between shadow-lg hover:shadow-amber-500/10 active:scale-98"
          >
            <div className="space-y-2.5">
              {/* Vignette avec Dégradé et Icône */}
              <div className="h-28 sm:h-32 rounded-xl bg-gradient-to-br from-indigo-950 via-gray-900 to-amber-950 flex flex-col items-center justify-center p-3 text-center border border-gray-800 relative overflow-hidden group-hover:scale-102 transition-transform">
                {game.badge && (
                  <span className="absolute top-2 right-2 text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500 text-gray-950 shadow">
                    {game.badge}
                  </span>
                )}

                {game.category === "keno" ? (
                  <div className="w-12 h-12 rounded-full bg-emerald-600 text-white font-black text-lg flex items-center justify-center shadow-lg">
                    80
                  </div>
                ) : game.category === "lucky6" ? (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-red-600 via-amber-500 to-blue-600 text-white font-black text-lg flex items-center justify-center shadow-lg">
                    6
                  </div>
                ) : game.category === "scratch" ? (
                  <Ticket className="w-10 h-10 text-amber-400" />
                ) : (
                  <Sparkles className="w-10 h-10 text-emerald-400" />
                )}

                <p className="font-black text-white text-sm sm:text-base mt-2 truncate w-full">
                  {game.title}
                </p>
              </div>

              <div>
                <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">
                  {game.description}
                </p>
              </div>
            </div>

            <div className="pt-3 mt-2 border-t border-gray-850 flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-amber-400">
                {game.maxWin}
              </span>
              <span className="px-3 py-1 bg-amber-500 text-gray-950 rounded-lg text-xs font-black group-hover:bg-amber-400 transition-colors flex items-center gap-1">
                <Play className="w-3 h-3 fill-current" /> Jouer
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
