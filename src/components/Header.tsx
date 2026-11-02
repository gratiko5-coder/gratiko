"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Translations, formatCurrency, Locale } from "@/lib/i18n";
import { Wallet, LogOut, Shield, Ticket, Menu, X, Globe, User, Smartphone } from "lucide-react";
import { subscribeWalletSync } from "@/lib/wallet-sync";

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
  const [balanceCents, setBalanceCents] = useState(user?.wallet?.balanceCents ?? 0);
  const currency = user?.wallet?.currency || "HTG";

  const fetchFreshBalance = useCallback(async () => {
    if (!user || user.role !== "PLAYER") return;
    try {
      const res = await fetch("/api/wallet/balance", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (typeof data.balanceCents === "number") {
          setBalanceCents(data.balanceCents);
        }
      }
    } catch {
      // Ignorer silencieusement
    }
  }, [user]);

  // Synchronisation solde temps réel
  useEffect(() => {
    if (user?.wallet?.balanceCents !== undefined) {
      setBalanceCents(user.wallet.balanceCents);
    }
  }, [user?.wallet?.balanceCents]);

  useEffect(() => {
    if (!user || user.role !== "PLAYER") return;

    // Charger immédiatement au montage
    fetchFreshBalance();

    // Écouter les événements d'achat, de grattage et de recharge
    const unsubscribe = subscribeWalletSync((newBal) => {
      if (typeof newBal === "number") {
        setBalanceCents(newBal);
      } else {
        fetchFreshBalance();
      }
    });

    // Écouter le retour sur l'onglet ou l'application mobile
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchFreshBalance();
      }
    };
    window.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", fetchFreshBalance);

    // Rafraîchissement automatique léger toutes les 10 secondes
    const interval = setInterval(fetchFreshBalance, 10000);

    return () => {
      unsubscribe();
      window.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", fetchFreshBalance);
      clearInterval(interval);
    };
  }, [user, fetchFreshBalance]);

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
    <header className="sticky top-0 z-50 bg-gray-950/95 backdrop-blur-md border-b border-gray-800/80 w-full max-w-full overflow-hidden">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        {/* Logo GRATIKO */}
        <Link href="/" className="flex items-center shrink-0 group">
          <img
            src="/logo.png"
            alt="GRATIKO"
            className="h-8 sm:h-10 w-auto max-w-[110px] sm:max-w-[150px] object-contain group-hover:scale-105 transition-transform"
          />
        </Link>

        {/* Navigation Desktop */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-300">
          {(!user || user.role === "PLAYER") && (
            <Link href="/tickets" className="hover:text-amber-400 transition-colors flex items-center gap-1.5">
              <Ticket className="w-4 h-4 text-amber-400" />
              {t.dashboard.buyTicketBtn}
            </Link>
          )}

          {user?.role === "PLAYER" && (
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

          {user && user.role !== "PLAYER" && (
            <Link
              href="/admin"
              className="text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/15 rounded-xl border border-amber-500/30 font-bold"
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
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Sélecteur de langue Desktop */}
          <div className="hidden md:flex items-center gap-1 text-xs bg-gray-900 border border-gray-800 rounded-lg p-1">
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
            <div className="flex items-center gap-1.5 sm:gap-3">
              {/* Badge Administrateur ou Solde joueur */}
              {user.role === "PLAYER" ? (
                <Link
                  href="/wallet"
                  className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-950 to-gray-900 border border-indigo-500/30 rounded-lg sm:rounded-xl px-2 sm:px-3 py-1 sm:py-1.5 shadow-sm hover:border-amber-500/40 transition-colors"
                >
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <span className="hidden sm:inline text-xs text-gray-400">Solde :</span>
                  <span className="text-xs sm:text-sm font-bold text-amber-400">
                    {formatCurrency(balanceCents, currency, currentLocale)}
                  </span>
                </Link>
              ) : (
                <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg sm:rounded-xl px-2 sm:px-3 py-1 sm:py-1.5">
                  <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                  <span className="text-[10px] sm:text-xs font-bold text-amber-300 uppercase tracking-wider">
                    {user.role === "SUPER_ADMIN" ? "SUPER ADMIN" : "ADMIN"}
                  </span>
                </div>
              )}

              {/* Bouton Déconnexion */}
              <button
                onClick={handleLogout}
                className="p-1.5 sm:p-2 text-gray-400 hover:text-red-400 transition-colors rounded-lg bg-gray-900 border border-gray-800"
                title={t.common.logout}
              >
                <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1 sm:gap-2">
              <Link
                href="/auth/login"
                className="text-xs font-semibold px-2.5 sm:px-3 py-1.5 sm:py-2 text-gray-200 hover:text-white bg-gray-900 sm:bg-transparent border border-gray-800 sm:border-transparent rounded-lg transition-colors"
              >
                {t.common.login}
              </Link>
              <Link
                href="/auth/register"
                className="hidden sm:inline-block text-xs font-bold px-3 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 rounded-xl shadow transition-all"
              >
                {t.common.register}
              </Link>
            </div>
          )}

          {/* Bouton Menu Mobile */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 text-gray-300 hover:text-white rounded-lg bg-gray-900 border border-gray-800"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Menu Mobile déroulant */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-gray-950/98 border-b border-gray-800 px-4 py-4 space-y-4 animate-in slide-in-from-top-2">
          {/* Sélecteur de langue Mobile */}
          <div className="bg-gray-900/90 border border-gray-800 rounded-xl p-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-amber-400" />
              Langue / Lang :
            </span>
            <div className="flex items-center gap-1">
              {(["fr", "ht", "en", "es"] as Locale[]).map((loc) => (
                <button
                  key={loc}
                  onClick={() => handleLocaleChange(loc)}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase transition-all ${
                    currentLocale === loc
                      ? "bg-amber-500 text-gray-950 shadow"
                      : "text-gray-400 hover:text-white bg-gray-800/60"
                  }`}
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>

          {/* Liens de navigation */}
          <div className="space-y-1">
            {(!user || user.role === "PLAYER") && (
              <Link
                href="/tickets"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 text-sm font-bold text-amber-400 hover:text-amber-300 py-2.5 px-3 rounded-lg hover:bg-gray-900"
              >
                <Ticket className="w-4 h-4 text-amber-400" />
                {t.dashboard.buyTicketBtn}
              </Link>
            )}

            {user?.role === "PLAYER" && (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white py-2 px-3 rounded-lg hover:bg-gray-900"
                >
                  <User className="w-4 h-4 text-indigo-400" />
                  {t.common.dashboard}
                </Link>
                <Link
                  href="/wallet"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between text-sm font-medium text-emerald-400 hover:text-emerald-300 py-2 px-3 rounded-lg hover:bg-gray-900"
                >
                  <span className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-emerald-400" />
                    {t.dashboard.walletTitle}
                  </span>
                  <span className="text-xs font-bold bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
                    {formatCurrency(balanceCents, currency, currentLocale)}
                  </span>
                </Link>
              </>
            )}

            {user && user.role !== "PLAYER" && (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 text-sm font-bold text-amber-400 hover:text-amber-300 py-2.5 px-3 rounded-lg bg-amber-500/10 border border-amber-500/20"
              >
                <Shield className="w-4 h-4 text-amber-400" />
                {t.common.adminDashboard}
              </Link>
            )}

            <Link
              href="/legal/rules"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-gray-200 py-2 px-3 rounded-lg hover:bg-gray-900"
            >
              📜 Règles & Cotes du jeu
            </Link>
          </div>

          {/* Téléchargement APK Android direct */}
          <div className="pt-1">
            <a
              href="/GRATIKO.apk"
              download="GRATIKO.apk"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-2.5 px-3 bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-300 font-bold text-xs rounded-xl border border-emerald-500/30 transition-colors shadow-sm"
            >
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span>📱 Télécharger l'App Android (.apk)</span>
            </a>
          </div>

          {/* Boutons d'action non-connecté sur Mobile */}
          {!user && (
            <div className="pt-2 border-t border-gray-800/80 flex flex-col gap-2">
              <Link
                href="/auth/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center text-sm font-black py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-gray-950 rounded-xl shadow"
              >
                {t.common.register}
              </Link>
              <Link
                href="/auth/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center text-sm font-medium py-2 text-gray-300 bg-gray-900 border border-gray-800 rounded-xl"
              >
                {t.common.login}
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
