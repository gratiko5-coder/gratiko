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
  Send,
  ExternalLink,
  Award,
  BookOpen,
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
      {/* Barre de navigation basse fixée sur mobile (Style ParyajPam officiel épuré sans bandeau noir) */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0c1424] border-t border-[#1a263d] px-1 pt-1.5 shadow-[0_-4px_20px_rgba(0,0,0,0.85)]"
        style={{
          paddingBottom: "max(env(safe-area-inset-bottom, 8px), 8px)",
        }}
      >
        <div className="grid grid-cols-5 items-center justify-between text-center">
          {/* 1. Live */}
          <Link
            href="/sports?tab=live"
            className={`flex flex-col items-center py-1 transition-colors ${
              pathname.includes("/sports") && typeof window !== "undefined" && window.location.search.includes("tab=live")
                ? "text-amber-400 font-black"
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
              pathname === "/sports" && (typeof window === "undefined" || !window.location.search.includes("tab=live"))
                ? "text-amber-400 font-black"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Trophy className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Sport</span>
          </Link>

          {/* 3. My Bets (Mes Paris) */}
          <Link
            href="/sports/my-bets"
            className={`flex flex-col items-center py-1 transition-colors ${
              pathname === "/sports/my-bets"
                ? "text-amber-400 font-black"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Ticket className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">My Bets</span>
          </Link>

          {/* 4. Games */}
          <Link
            href="/games"
            className={`flex flex-col items-center py-1 transition-colors ${
              pathname.includes("/games") || pathname.includes("/tickets")
                ? "text-amber-400 font-black"
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
              drawerOpen ? "text-amber-400 font-black" : "text-gray-400 hover:text-white"
            }`}
          >
            <Menu className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Menu</span>
          </button>
        </div>
      </nav>

      {/* Tiroir Menu Latéral Mobile (Copie fidèle de la maquette Image 4) */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end animate-in fade-in">
          <div className="w-[85%] max-w-sm h-full bg-[#0a1120] border-l border-[#1a263d] p-4 flex flex-col justify-between shadow-2xl overflow-y-auto animate-in slide-in-from-right">
            <div className="space-y-4">
              {/* Header avec Drapeau et bouton Fermer */}
              <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🇭🇹</span>
                  <span className="text-sm font-black text-white tracking-wider">
                    GRATIKO
                  </span>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Bannière Télécharger APK Android (Exactement comme Image 4) */}
              <a
                href="/GRATIKO.apk"
                download="GRATIKO.apk"
                className="block relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 p-3 shadow-lg text-gray-950 group"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold text-gray-900 leading-tight">
                      GRATIKO
                    </p>
                    <h4 className="text-base font-black leading-tight tracking-tight">
                      MOBILE APP
                    </h4>
                    <span className="inline-flex items-center gap-1 text-[11px] font-black bg-blue-600 text-white px-3 py-1 rounded-lg mt-1 shadow">
                      Download apk
                    </span>
                  </div>
                  <div className="w-14 h-14 flex items-center justify-center">
                    <Smartphone className="w-12 h-12 text-emerald-800 animate-bounce" />
                  </div>
                </div>
              </a>

              {/* 4 Cercles Sociaux (Instagram, WhatsApp, Telegram, Facebook comme sur Image 4) */}
              <div className="flex items-center justify-around py-1.5">
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center shadow-md active:scale-95 transition-all"
                  title="Instagram"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <a
                  href="https://wa.me/50937000000"
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md active:scale-95 transition-all"
                  title="WhatsApp"
                >
                  <MessageCircle className="w-5 h-5" />
                </a>
                <a
                  href="https://t.me/gratiko"
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-md active:scale-95 transition-all"
                  title="Telegram"
                >
                  <Send className="w-5 h-5 ml-0.5" />
                </a>
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md active:scale-95 transition-all"
                  title="Facebook"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.374 14.5 5 15.5 5H18V0h-3.808C10.597 0 9 1.583 9 4.615V8z"/>
                  </svg>
                </a>
              </div>

              {/* Menu List Items (Conforme mot à mot à Image 4) */}
              <div className="divide-y divide-gray-850/60 text-xs font-semibold text-gray-300">
                <Link
                  href="/legal/rules"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center justify-between py-3 hover:text-white transition-colors"
                >
                  <span className="flex items-center gap-3">
                    <BookOpen className="w-4 h-4 text-gray-400" />
                    <span>Blog & Annonces</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </Link>

                <Link
                  href="/games"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center justify-between py-3 hover:text-white transition-colors"
                >
                  <span className="flex items-center gap-3">
                    <Gift className="w-4 h-4 text-gray-400" />
                    <span>Bonuses and special offers</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </Link>

                <Link
                  href="/games"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center justify-between py-3 hover:text-white transition-colors"
                >
                  <span className="flex items-center gap-3">
                    <Award className="w-4 h-4 text-gray-400" />
                    <span>Top wins (Meilleurs gains)</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </Link>

                <Link
                  href="/legal/rules"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center justify-between py-3 hover:text-white transition-colors"
                >
                  <span className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span>Sport betting Terms & conditions</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </Link>

                <Link
                  href="/legal/rules"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center justify-between py-3 hover:text-white transition-colors"
                >
                  <span className="flex items-center gap-3">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span>Partners (Agents MonCash / NatCash)</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </Link>

                <Link
                  href="/legal/privacy"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center justify-between py-3 hover:text-white transition-colors"
                >
                  <span className="flex items-center gap-3">
                    <HelpCircle className="w-4 h-4 text-gray-400" />
                    <span>About (À propos de GRATIKO)</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </Link>

                <Link
                  href="/wallet"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center justify-between py-3 hover:text-white transition-colors"
                >
                  <span className="flex items-center gap-3">
                    <Settings className="w-4 h-4 text-gray-400" />
                    <span>Settings & Portefeuille</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </Link>

                <a
                  href="/GRATIKO.apk"
                  download="GRATIKO.apk"
                  className="flex items-center justify-between py-3 hover:text-white transition-colors text-amber-400 font-bold"
                >
                  <span className="flex items-center gap-3">
                    <ExternalLink className="w-4 h-4 text-amber-400" />
                    <span>Download app (APK)</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-amber-400" />
                </a>

                {user ? (
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-between py-3 text-red-400 hover:text-red-300 font-bold"
                  >
                    <span className="flex items-center gap-3">
                      <LogOut className="w-4 h-4 text-red-400" />
                      <span>Déconnexion ({user.fullName})</span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-red-400" />
                  </button>
                ) : (
                  <Link
                    href="/auth/login"
                    onClick={() => setDrawerOpen(false)}
                    className="flex items-center justify-between py-3 text-amber-400 font-bold"
                  >
                    <span className="flex items-center gap-3">
                      <Users className="w-4 h-4 text-amber-400" />
                      <span>Login / Connexion</span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-amber-400" />
                  </Link>
                )}
              </div>
            </div>

            {/* Version comme en bas à droite sur Image 4 */}
            <div className="pt-3 border-t border-gray-850 flex items-center justify-between text-[11px] text-gray-500 font-mono">
              <span>Haïti & International</span>
              <span>2.36.6</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
