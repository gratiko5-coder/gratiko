import React from "react";
import { cookies } from "next/headers";
import { getDictionary, Locale } from "@/lib/i18n";
import { HeartPulse, ShieldAlert, PhoneCall } from "lucide-react";

export default async function RisksPage() {
  const cookieStore = await cookies();
  const locale = (cookieStore.get("NEXT_LOCALE")?.value as Locale) || "fr";
  const t = getDictionary(locale);

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-8">
      <div className="space-y-2">
        <span className="text-xs uppercase font-bold text-amber-400 tracking-wider">PROTECTION DES JOUEURS</span>
        <h1 className="text-3xl font-black text-white">{t.legal.responsibleGaming}</h1>
        <p className="text-xs text-gray-400">Jouer doit rester un divertissement responsable.</p>
      </div>

      <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-950/40 to-gray-900 border border-amber-500/30 space-y-4">
        <div className="flex items-center gap-3">
          <HeartPulse className="w-6 h-6 text-amber-400" />
          <h2 className="text-lg font-black text-white">Nos Engagements de Jeu Éthique</h2>
        </div>
        <p className="text-xs text-gray-300 leading-relaxed">
          Les jeux de hasard et d'argent comportent des risques d'endettement, d'isolement et de dépendance. GRATIKO intègre des outils d'auto-limitation, de suspension volontaire de compte et de détection précoce des comportements à risque.
        </p>
      </div>

      <div className="space-y-6 text-sm text-gray-300 leading-relaxed">
        <section className="space-y-2">
          <h3 className="text-base font-bold text-white">Conseils de Prudence :</h3>
          <ul className="list-disc list-inside space-y-1.5 text-xs text-gray-400">
            <li>Ne misez jamais de l'argent dont vous avez besoin pour vos dépenses essentielles (nourriture, loyer, scolarité).</li>
            <li>Fixez-vous des limites strictes de temps et de budget avant de commencer à jouer.</li>
            <li>Ne tentez jamais de « vous refaire » après une série de tickets perdants.</li>
            <li>Le jeu est une activité récréative et non une méthode pour s'enrichir ou résoudre des difficultés financières.</li>
          </ul>
        </section>

        <section className="space-y-3 pt-4 border-t border-gray-800">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <PhoneCall className="w-4 h-4 text-emerald-400" />
            Besoin d'aide ou d'accompagnement ?
          </div>
          <p className="text-xs text-gray-400">
            Si vous ressentez une perte de contrôle ou des difficultés liées au jeu, contactez sans hésiter notre service de soutien ou les associations spécialisées dans votre région. Vous pouvez demander une exclusion temporaire ou définitive à tout moment depuis les paramètres de votre compte.
          </p>
        </section>
      </div>
    </div>
  );
}
