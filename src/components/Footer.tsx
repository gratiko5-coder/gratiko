import React from "react";
import Link from "next/link";
import { Shield, Smartphone, AlertCircle } from "lucide-react";
import { Translations } from "@/lib/i18n";

export default function Footer({ t }: { t: Translations }) {
  return (
    <footer className="bg-gray-950 border-t border-gray-900 text-gray-400 py-12 mt-16 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Marque */}
          <div className="space-y-3">
            <Link href="/" className="inline-block">
              <img
                src="/logo.png"
                alt="GRATIKO"
                className="h-10 w-auto object-contain"
              />
            </Link>
            <p className="text-gray-400 leading-relaxed">
              {t.common.tagline}. Système de loterie instantanée scellée et auditable.
            </p>
            <div className="pt-2">
              <a
                href="/GRATIKO.apk"
                download="GRATIKO.apk"
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold rounded-xl shadow-md text-xs transition-all"
              >
                <Smartphone className="w-4 h-4 text-emerald-200" />
                <span>Télécharger l'App Android (.APK)</span>
              </a>
            </div>
          </div>

          {/* Jeux & Tickets */}
          <div className="space-y-2">
            <h4 className="text-white font-bold text-sm">Jeux</h4>
            <ul className="space-y-1.5">
              <li>
                <Link href="/tickets" className="hover:text-amber-400 transition-colors">
                  Chans Lakay 100 HTG
                </Link>
              </li>
              <li>
                <Link href="/tickets" className="hover:text-amber-400 transition-colors">
                  Gwo Chans 250 HTG
                </Link>
              </li>
              <li>
                <Link href="/tickets" className="hover:text-amber-400 transition-colors">
                  Milyonè Kreyòl 500 HTG
                </Link>
              </li>
              <li>
                <Link href="/tickets" className="hover:text-amber-400 transition-colors">
                  Jackpot VIP 1 000 HTG
                </Link>
              </li>
            </ul>
          </div>

          {/* Règles et Transparence */}
          <div className="space-y-2">
            <h4 className="text-white font-bold text-sm">Transparence & Règles</h4>
            <ul className="space-y-1.5">
              <li>
                <Link href="/legal/rules" className="hover:text-amber-400 transition-colors">
                  Règlement & Probabilités
                </Link>
              </li>
              <li>
                <Link href="/legal/terms" className="hover:text-amber-400 transition-colors">
                  Conditions Générales d'Utilisation
                </Link>
              </li>
              <li>
                <Link href="/legal/privacy" className="hover:text-amber-400 transition-colors">
                  Politique de Confidentialité
                </Link>
              </li>
              <li>
                <Link href="/legal/risks" className="hover:text-amber-400 transition-colors">
                  Jeu Responsable & Prévention
                </Link>
              </li>
            </ul>
          </div>

          {/* Sécurité et Conformité */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Shield className="w-4 h-4 text-emerald-400" />
              Sécurité & Intégrité
            </div>
            <p className="text-gray-400 leading-relaxed">
              Tirages générés par RNG cryptographique côté serveur. Comptabilité à double entrée traçable et solde immuable.
            </p>
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-[11px] flex gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>
                {process.env.NEXT_PUBLIC_APP_MODE === "PRODUCTION"
                  ? "Jeu responsable : Loterie sécurisée et certifiée. Réservé strictement aux personnes majeures (+18 ans). Jouez avec modération."
                  : "Environnement de démonstration. Réservé aux personnes majeures selon la législation en vigueur."}
              </span>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-900 flex flex-col md:flex-row items-center justify-between gap-4 text-gray-400 text-center md:text-left">
          <p>© {new Date().getFullYear()} GRATIKO. Tous droits réservés.</p>
          <p className="text-[11px]">
            Conçu pour Haïti et l'expansion internationale (Caraïbes & Afrique).
          </p>
        </div>
      </div>
    </footer>
  );
}
