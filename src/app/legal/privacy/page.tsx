import React from "react";
import { cookies } from "next/headers";
import { getDictionary, Locale } from "@/lib/i18n";

export default async function PrivacyPage() {
  const cookieStore = await cookies();
  const locale = (cookieStore.get("NEXT_LOCALE")?.value as Locale) || "fr";
  const t = getDictionary(locale);

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-8">
      <div className="space-y-2">
        <span className="text-xs uppercase font-bold text-amber-400 tracking-wider">PROTECTION DES DONNÉES</span>
        <h1 className="text-3xl font-black text-white">{t.legal.privacyTitle}</h1>
        <p className="text-xs text-gray-400">Respect de la vie privée et auditabilité des transactions.</p>
      </div>

      <div className="space-y-6 text-sm text-gray-300 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">1. Données Collectées</h2>
          <p>
            GRATIKO collecte uniquement les données strictement nécessaires au fonctionnement du portefeuille et à la conformité financière : nom complet, adresse email, numéro de téléphone de liaison et journaux techniques d'audit d'adresses IP.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">2. Sécurité des Mots de Passe et Sessions</h2>
          <p>
            Aucun mot de passe n'est jamais stocké en clair. Tous les mots de passe sont hachés via l'algorithme cryptographique bcrypt avec facteur de travail élevé (12 rounds). Les sessions sont protégées par des jetons JWT chiffrés et transmis exclusivement via cookies HttpOnly.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">3. Non-Divulgation</h2>
          <p>
            GRATIKO ne commercialise ni ne transfère aucune donnée personnelle à des courtiers tiers. Les données de transaction sont conservées dans le grand livre à double entrée pour assurer la traçabilité comptable et légale.
          </p>
        </section>
      </div>
    </div>
  );
}
