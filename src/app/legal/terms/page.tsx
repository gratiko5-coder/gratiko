import React from "react";
import { cookies } from "next/headers";
import { getDictionary, Locale } from "@/lib/i18n";
import { AlertTriangle, ShieldCheck } from "lucide-react";

export default async function TermsPage() {
  const cookieStore = await cookies();
  const locale = (cookieStore.get("NEXT_LOCALE")?.value as Locale) || "fr";
  const t = getDictionary(locale);

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-8">
      <div className="space-y-2">
        <span className="text-xs uppercase font-bold text-amber-400 tracking-wider">CADRE CONTRACTUEL</span>
        <h1 className="text-3xl font-black text-white">{t.legal.termsTitle}</h1>
        <p className="text-xs text-gray-400">Dernière révision technique : Novembre 2026</p>
      </div>

      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
        <p>
          <strong>AVERTISSEMENT LÉGAL :</strong> Ce document constitue un modèle d'architecture contractuelle préparatoire. Il est soumis à la validation formelle d'un conseil juridique agréé et à l'obtention des agréments auprès des autorités régulatrices de chaque juridiction (notamment en République d'Haïti).
        </p>
      </div>

      <div className="space-y-6 text-sm text-gray-300 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">1. Objet et Champ d'Application</h2>
          <p>
            Les présentes Conditions Générales régissent l'utilisation de la plateforme numérique GRATIKO, accessible via le web et applications connectées. GRATIKO fournit un service de tickets virtuels à gratter et jeux instantanés à issue cryptographiquement scellée.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">2. Éligibilité et Majorité Légale</h2>
          <p>
            L'inscription et le jeu sur GRATIKO sont strictement réservés aux personnes physiques majeures (18 ans révolus ou majorité légale en vigueur dans le pays de résidence). GRATIKO se réserve le droit d'exiger des pièces d'identité à tout moment.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">3. Mode Démonstration et Crédits Fictifs</h2>
          <p>
            En phase d'essai, GRATIKO opère en mode de démonstration sécurisé. Les crédits alloués, les achats de tickets et les gains associés sont strictement fictifs et ne confèrent aucun droit de créance réelle.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">4. Immuabilité des Résultats</h2>
          <p>
            Tout achat de ticket est définitif. Le résultat du ticket est tiré et scellé de manière inaltérable par le moteur serveur au moment de la transaction. L'interface graphique de grattage n'a qu'un rôle de révélation visuelle.
          </p>
        </section>
      </div>
    </div>
  );
}
