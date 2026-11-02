"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Flame, Trophy, Ticket, Gamepad2, Menu, X, Wallet, ArrowDownLeft, ArrowUpRight, Shield, LogOut } from "lucide-react";

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
          {/* Live */}
          <Link
            href="/sports?tab=live"
            className={`flex flex-col items-center py-1 transition-colors ${
              pathname.includes("/sports")
                ? "text-amber-400 font-bold"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Flame className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Live</span>
          </Link>

          {/* Sport */}
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

          {/* Mes Paris */}
          <Link
            href="/sports/my-bets"
            className={`flex flex-col items-center py-1 transition-colors ${
              pathname === "/sports/my-bets"
                ? "text-amber-400 font-bold"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Ticket className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Mes Paris</span>
          </Link>

          {/* Jeux (Tickets & Instant) */}
          <Link
            href="/tickets"
            className={`flex flex-col items-center py-1 transition-colors ${
              pathname.includes("/tickets") || pathname.includes("/games")
                ? "text-amber-400 font-bold"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Gamepad2 className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Jeux</span>
          </Link>

          {/* Menu */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex flex-col items-center py-1 text-gray-400 hover:text-white transition-colors"
          >
            <Menu className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Menu</span>
          </button>
        </div>
      </nav>

      {/* Tiroir Menu Latéral Mobile */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end animate-in fade-in">
          <div className="w-4/5 max-w-xs h-full bg-gray-950 border-l border-gray-800 p-5 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                <img src="/logo.png" alt="GRATIKO" className="h-8 w-auto object-contain" />
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-1.5 rounded-lg bg-gray-900 text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {user ? (
                <div className="p-3 bg-gradient-to-br from-indigo-950 to-gray-900 rounded-2xl border border-indigo-500/30 space-y-1">
                  <p className="text-xs text-gray-400">Joueur connecté</p>
                  <p className="text-sm font-bold text-white truncate">{user.fullName}</p>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Link
                    href="/auth/login"
                    onClick={() => setDrawerOpen(false)}
                    className="flex-1 py-2 text-center text-xs font-bold text-white bg-gray-900 rounded-xl border border-gray-800"
                  >
                    Connexion
                  </Link>
                  <Link
                    href="/auth/register"
                    onClick={() => setDrawerOpen(false)}
                    className="flex-1 py-2 text-center text-xs font-bold text-gray-950 bg-amber-400 rounded-xl"
                  >
                    Inscription
                  </Link>
                </div>
              )}

              {/* Liens principaux */}
              <div className="space-y-2 text-sm font-semibold">
                <Link
                  href="/sports"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-900 text-gray-200"
                >
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span>Paris Sportifs (Paryaj)</span>
                </Link>

                <Link
                  href="/tickets"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-900 text-gray-200"
                >
                  <Gamepad2 className="w-4 h-4 text-emerald-400" />
                  <span>Tickets à Gratter & Flash</span>
                </Link>

                <Link
                  href="/wallet"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-900 text-gray-200"
                >
                  <Wallet className="w-4 h-4 text-indigo-400" />
                  <span>Mon Portefeuille</span>
                </Link>

                <Link
                  href="/sports/my-bets"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-900 text-gray-200"
                >
                  <Ticket className="w-4 h-4 text-purple-400" />
                  <span>Historique des Paris</span>
                </Link>

                {user && user.role !== "PLAYER" && (
                  <Link
                    href="/admin"
                    onClick={() => setDrawerOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 font-bold"
                  >
                    <Shield className="w-4 h-4 text-amber-400" />
                    <span>Tableau Super Admin</span>
                  </Link>
                )}
              </div>
            </div>

            {user && (
              <button
                onClick={handleLogout}
                className="w-full py-2.5 flex items-center justify-center gap-2 text-xs font-bold text-red-400 bg-red-950/20 hover:bg-red-950/40 rounded-xl border border-red-500/20"
              >
                <LogOut className="w-4 h-4" /> Déconnexion
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
