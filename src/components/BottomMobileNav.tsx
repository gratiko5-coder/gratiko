"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Flame,
  Trophy,
  Ticket,
  Gamepad2,
  Menu,
  X,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Shield,
  LogOut,
  Smartphone,
  Download,
  Share2,
  FileText,
  Gift,
  HelpCircle,
  ChevronRight,
  Sparkles,
  Users,
  Settings,
  MessageCircle,
} from "lucide-react";

interface BottomMobileNavProps {
  user: {
    id: string;
    fullName: string;
    role: string;
  } | null;
}

export default function BottomMobileNav({ user }: BottomMobileNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/auth/login");
    router.refresh();
  };

  return (
    <>
      {/* Barre de navigation basse fixée sur mobile avec dégagement généreux des touches virtuelles Android (||| [] <) */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-gray-950/98 backdrop-blur-xl border-t border-gray-800/90 px-2 pt-2.5 shadow-[0_-8px_30px_rgba(0,0,0,0.95)]"
        style={{
          paddingBottom: "max(calc(env(safe-area-inset-bottom, 0px) + 26px), 48px)",
        }}
      >
        <div className="grid grid-cols-5 items-center justify-between text-center">
          {/* 1. Live */}
          <Link
            href="/sports?tab=live"
            className={`flex flex-col items-center py-1 transition-colors ${
              pathname.includes("/sports") && typeof window !== "undefined" && window.location.search.includes("tab=live")
                ? "text-amber-400 font-bold"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Flame className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Live</span>
          </Link>

          {/* 2. Sport */}
          <Link
            href="/sports"
            className={`flex flex-col items-center py-1 transition-colors ${
              pathname === "/sports"
                ? "text-amber-400 font-bold"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Trophy className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Sport</span>
          </Link>

          {/* 3. Mes Paris (My Bets) */}
          <Link
            href="/sports/my-bets"
            className={`flex flex-col items-center py-1 transition-colors ${
              pathname === "/sports/my-bets"
                ? "text-amber-400 font-bold"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Ticket className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">My Bets</span>
          </Link>

          {/* 4. Games (Lobby & Keno / Lucky6 / Scratch) */}
          <Link
            href="/games"
            className={`flex flex-col items-center py-1 transition-colors ${
              pathname.includes("/games") || pathname.includes("/tickets")
                ? "text-amber-400 font-bold"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Gamepad2 className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Games</span>
          </Link>

          {/* 5. Menu */}
          <button
            onClick={() => setDrawerOpen(true)}
            className={`flex flex-col items-center py-1 transition-colors ${
              drawerOpen ? "text-amber-400 font-bold" : "text-gray-400 hover:text-white"
            }`}
          >
            <Menu className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Menu</span>
          </button>
        </div>
      </nav>

      {/* Tiroir Menu Latéral Mobile (Modèle ParyajPam Panel 1) */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end animate-in fade-in">
          <div className="w-[85%] max-w-sm h-full bg-gray-950 border-l border-gray-800 p-4 flex flex-col justify-between shadow-2xl overflow-y-auto animate-in slide-in-from-right">
            <div className="space-y-4">
              {/* Header avec Logo et bouton Fermer */}
              <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                <div className="flex items-center gap-2">
                  <img src="/logo.png" alt="GRATIKO" className="h-8 w-auto object-contain" />
                  <span className="text-xs font-black text-amber-400 uppercase tracking-wider">
                    GRATIKO
                  </span>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-1.5 rounded-lg bg-gray-900 text-gray-400 hover:text-white border border-gray-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Bannière Télécharger APK Android (comme sur la maquette Panel 1) */}
              <a
                href="/GRATIKO.apk"
                download="GRATIKO.apk"
                className="block relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 p-3.5 shadow-lg border border-amber-300 text-gray-950 group"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-gray-950 text-amber-400 px-2 py-0.5 rounded">
                      Application Officielle
                    </span>
                    <h4 className="text-sm font-black leading-tight">
                      GRATIKO MOBILE APP
                    </h4>
                    <span className="inline-flex items-center gap-1 text-[11px] font-extrabold bg-gray-950 text-white px-2.5 py-1 rounded-lg mt-1 group-hover:bg-black transition-colors">
                      <Download className="w-3.5 h-3.5 text-amber-400" />
                      Download apk
                    </span>
                  </div>
                  <div className="w-12 h-12 bg-gray-950/20 rounded-2xl flex items-center justify-center">
                    <Smartphone className="w-8 h-8 text-gray-950" />
                  </div>
                </div>
              </a>

              {/* Réseaux sociaux / Communauté */}
              <div className="flex items-center justify-around py-2 bg-gray-900/80 rounded-xl border border-gray-800">
                <a
                  href="https://wa.me/50937000000"
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 rounded-full bg-emerald-600/20 text-emerald-400 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all"
                  title="WhatsApp"
                >
                  <MessageCircle className="w-4 h-4" />
                </a>
                <a
                  href="https://t.me/gratiko"
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 rounded-full bg-sky-600/20 text-sky-400 flex items-center justify-center hover:bg-sky-600 hover:text-white transition-all"
                  title="Telegram"
                >
                  <Share2 className="w-4 h-4" />
                </a>
                <a
                  href="/legal/rules"
                  onClick={() => setDrawerOpen(false)}
                  className="w-9 h-9 rounded-full bg-amber-600/20 text-amber-400 flex items-center justify-center hover:bg-amber-600 hover:text-white transition-all"
                  title="Règles"
                >
                  <FileText className="w-4 h-4" />
                </a>
              </div>

              {/* Statut utilisateur / Authentification */}
              {user ? (
                <div className="p-3 bg-gradient-to-br from-gray-900 to-gray-950 rounded-2xl border border-amber-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-bold">Joueur connecté</p>
                      <p className="text-xs font-black text-white truncate">{user.fullName}</p>
                    </div>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                      Vérifié
                    </span>
                  </div>

                  <div className="flex gap-2 pt-1 border-t border-gray-800">
                    <Link
                      href="/wallet"
                      onClick={() => setDrawerOpen(false)}
                      className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-center text-[11px] rounded-lg transition-colors flex items-center justify-center gap-1"
                    >
                      <ArrowDownLeft className="w-3.5 h-3.5" /> Recharger
                    </Link>
                    <Link
                      href="/wallet"
                      onClick={() => setDrawerOpen(false)}
                      className="flex-1 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold text-center text-[11px] rounded-lg transition-colors flex items-center justify-center gap-1"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" /> Retrait
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Link
                    href="/auth/login"
                    onClick={() => setDrawerOpen(false)}
                    className="flex-1 py-2.5 text-center text-xs font-black text-white bg-gray-900 rounded-xl border border-gray-800 hover:bg-gray-800"
                  >
                    Connexion
                  </Link>
                  <Link
                    href="/auth/register"
                    onClick={() => setDrawerOpen(false)}
                    className="flex-1 py-2.5 text-center text-xs font-black text-gray-950 bg-amber-400 rounded-xl hover:bg-amber-300"
                  >
                    Inscription
                  </Link>
                </div>
              )}

              {/* Menu List Items (identique à Panel 1 de la maquette) */}
              <div className="space-y-1 text-xs font-bold text-gray-300">
                <Link
                  href="/games"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-900 transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    <Gamepad2 className="w-4 h-4 text-amber-400" />
                    <span>Lobby des Jeux (Keno, Lucky 6, Grattage)</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </Link>

                <Link
                  href="/sports"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-900 transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span>Paris Sportifs (1X2 & Combinés)</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </Link>

                <Link
                  href="/sports/my-bets"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-900 transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    <Ticket className="w-4 h-4 text-purple-400" />
                    <span>Mes Paris & Coupons</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </Link>

                <Link
                  href="/wallet"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-900 transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    <Wallet className="w-4 h-4 text-emerald-400" />
                    <span>Mon Portefeuille (MonCash & NatCash)</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </Link>

                <div className="my-2 border-t border-gray-850" />

                <Link
                  href="/legal/rules"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-900 transition-colors text-gray-400 hover:text-white"
                >
                  <span className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span>Conditions Générales & Paris</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </Link>

                <Link
                  href="/legal/risks"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-900 transition-colors text-gray-400 hover:text-white"
                >
                  <span className="flex items-center gap-2.5">
                    <Shield className="w-4 h-4 text-gray-400" />
                    <span>Jeu Responsable (+18)</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </Link>

                {user && user.role !== "PLAYER" && (
                  <Link
                    href="/admin"
                    onClick={() => setDrawerOpen(false)}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 font-black mt-2"
                  >
                    <span className="flex items-center gap-2.5">
                      <Shield className="w-4 h-4 text-amber-400" />
                      <span>Espace Super Admin</span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-amber-400" />
                  </Link>
                )}
              </div>
            </div>

            {/* Pied du menu */}
            <div className="pt-4 border-t border-gray-800 space-y-3">
              {user && (
                <button
                  onClick={handleLogout}
                  className="w-full py-2.5 flex items-center justify-center gap-2 text-xs font-bold text-red-400 bg-red-950/20 hover:bg-red-950/40 rounded-xl border border-red-500/20 transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Déconnexion
                </button>
              )}
              <p className="text-[10px] text-gray-600 text-center font-mono">
                GRATIKO v2.6.0 • Ayiti & Entènasyonal
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
