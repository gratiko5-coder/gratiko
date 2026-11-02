"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Translations, formatCurrency, Locale } from "@/lib/i18n";
import { Sparkles, Wallet, LogOut, Shield, Ticket, Menu, X, Globe } from "lucide-react";

interface HeaderProps {
  user: {
    id: string;
    fullName: string;
    email: string;
    role: string;
    wallet?: {
      balanceCents: number;
      currency: string;
    } | null;
  } | null;
  t: Translations;
  currentLocale: Locale;
}

export default function Header({ user, t, currentLocale }: HeaderProps) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLocaleChange = async (newLocale: string) => {
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;
    router.refresh();
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/auth/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 bg-gray-950/90 backdrop-blur-md border-b border-gray-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo GRATIKO */}
        <Link href="/" className="flex items-center gap-3 group">
          <img
            src="/logo.png"
            alt="GRATIKO"
            className="h-10 w-auto max-w-[150px] object-contain group-hover:scale-105 transition-transform"
          />
        </Link>

        {/* Navigation Desktop */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-300">
          <Link href="/tickets" className="hover:text-amber-400 transition-colors flex items-center gap-1.5">
            <Ticket className="w-4 h-4 text-amber-400" />
            {t.dashboard.buyTicketBtn}
          </Link>
          {user && (
            <>
              <Link href="/dashboard" className="hover:text-amber-400 transition-colors">
                {t.common.dashboard}
              </Link>
              <Link href="/wallet" className="hover:text-amber-400 transition-colors flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-emerald-400" />
                {t.dashboard.walletTitle}
              </Link>
            </>
          )}
          {(user?.role === "SUPER_ADMIN" || user?.role === "COUNTRY_ADMIN") && (
            <Link
              href="/admin"
              className="text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 rounded-lg border border-amber-500/20"
            >
              <Shield className="w-4 h-4" />
              {t.common.adminDashboard}
            </Link>
          )}
          <Link href="/legal/rules" className="hover:text-gray-100 transition-colors">
            Règles & Cotes
          </Link>
        </nav>

        {/* Actions Utilisateur & Sélecteur de langue */}
        <div className="flex items-center gap-3">
          {/* Sélecteur de langue */}
          <div className="flex items-center gap-1 text-xs bg-gray-900 border border-gray-800 rounded-lg p-1">
            <Globe className="w-3.5 h-3.5 text-gray-400 ml-1" />
            {(["fr", "ht", "en", "es"] as Locale[]).map((loc) => (
              <button
                key={loc}
                onClick={() => handleLocaleChange(loc)}
                className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase transition-all ${
                  currentLocale === loc
                    ? "bg-amber-500 text-gray-950 shadow"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {loc}
              </button>
            ))}
          </div>

          {user ? (
            <div className="flex items-center gap-3">
              {/* Solde portefeuille */}
              <Link
                href="/wallet"
                className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-indigo-950 to-gray-900 border border-indigo-500/30 rounded-xl px-3 py-1.5 shadow-sm hover:border-amber-500/40 transition-colors"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-gray-400">Solde :</span>
                <span className="text-sm font-bold text-amber-400">
                  {formatCurrency(user.wallet?.balanceCents || 0, user.wallet?.currency || "HTG", currentLocale)}
                </span>
              </Link>

              {/* Bouton Déconnexion */}
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-red-400 transition-colors rounded-lg bg-gray-900 border border-gray-800"
                title={t.common.logout}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/auth/login"
                className="text-xs font-semibold px-3 py-2 text-gray-300 hover:text-white transition-colors"
              >
                {t.common.login}
              </Link>
              <Link
                href="/auth/register"
                className="text-xs font-bold px-3 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 rounded-xl shadow transition-all"
              >
                {t.common.register}
              </Link>
            </div>
          )}

          {/* Bouton Menu Mobile */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-400 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Menu Mobile déroulant */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-gray-950 border-b border-gray-800 px-4 py-4 space-y-3">
          <Link
            href="/tickets"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-amber-400 py-1"
          >
            {t.dashboard.buyTicketBtn}
          </Link>
          {user && (
            <>
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-medium text-gray-300 py-1"
              >
                {t.common.dashboard}
              </Link>
              <Link
                href="/wallet"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-medium text-emerald-400 py-1"
              >
                {t.dashboard.walletTitle} (
                {formatCurrency(user.wallet?.balanceCents || 0, user.wallet?.currency || "HTG", currentLocale)})
              </Link>
            </>
          )}
          {(user?.role === "SUPER_ADMIN" || user?.role === "COUNTRY_ADMIN") && (
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-amber-400 py-1"
            >
              {t.common.adminDashboard}
            </Link>
          )}
          <Link
            href="/legal/rules"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-gray-400 py-1"
          >
            Règles & Cotes du jeu
          </Link>
        </div>
      )}
    </header>
  );
}
