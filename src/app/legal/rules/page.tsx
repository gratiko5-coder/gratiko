import React from "react";
import { cookies } from "next/headers";
import { getDictionary, Locale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { Shield, Sparkles, CheckCircle, TrendingUp } from "lucide-react";

export default async function RulesPage() {
  const cookieStore = await cookies();
  const locale = (cookieStore.get("NEXT_LOCALE")?.value as Locale) || "fr";
  const t = getDictionary(locale);

  const batches = await prisma.ticketBatch.findMany({
    where: { status: "ACTIVE" },
    include: { ticketType: true, prizeTiers: true },
  });

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8">
      <div className="space-y-3">
        <span className="text-xs uppercase font-bold text-amber-400 tracking-wider">
          TRANSPARENCE & INTÉGRITÉ MATHÉMATIQUE
        </span>
        <h1 className="text-3xl font-black text-white">{t.legal.rulesTitle}</h1>
        <p className="text-sm text-gray-400 leading-relaxed">
          Règles officielles de distribution, génération cryptographique des résultats et tableaux des probabilités par catégorie de gain.
        </p>
      </div>

      {/* Piliers du règlement */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-gray-900 border border-gray-800 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">Principe du Grattage Sécurisé</h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            Chaque ticket virtuel comporte une grille de 9 cases. Si 3 symboles identiques sont révélés, le joueur remporte le lot associé. Le résultat est scellé de manière immuable sur le serveur dès l'achat.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-gray-900 border border-gray-800 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Shield className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">Générateur Aléatoire CSPRNG</h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            Les tirages utilisent le module cryptographique serveur (Node.js crypto.randomInt), garantissant une imprévisibilité totale. Aucune variable de profil ou de solde n'influence le tirage.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-gray-900 border border-gray-800 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">Jackpot Évolutif (Réserve 40%)</h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            Le montant MAX (Jackpot) s'accroît en continu au fur et à mesure des paris : 40 % de l'allocation jeu (32 % du prix de chaque ticket vendu) s'accumulent directement dans la cagnotte maximale jusqu'à ce qu'elle soit remportée.
          </p>
        </div>
      </div>

      {/* Tables des cotes par ticket */}
      <div className="space-y-6 pt-4">
        <h2 className="text-2xl font-black text-white">Tableaux des Probabilités et des Lots en Vigueur</h2>

        {batches.map((batch) => (
          <div key={batch.id} className="rounded-3xl bg-gray-900/60 border border-gray-800 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-gray-800 pb-4">
              <div>
                <h3 className="text-xl font-black text-white">{batch.ticketType.name}</h3>
                <p className="text-xs text-gray-400 font-mono">Lot N° {batch.batchNumber} • Taille du lot: {batch.totalTickets} tickets</p>
              </div>
              <span className="px-3 py-1 bg-amber-500/20 text-amber-300 rounded-xl text-xs font-black">
                Prix: {batch.ticketType.priceCents / 100} {batch.currency}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-300">
                <thead className="bg-gray-950 text-gray-400 uppercase font-semibold">
                  <tr>
                    <th className="px-4 py-2.5">Catégorie</th>
                    <th className="px-4 py-2.5">Gain</th>
                    <th className="px-4 py-2.5">Probabilité</th>
                    <th className="px-4 py-2.5">Chances relatives</th>
                    <th className="px-4 py-2.5">Quantité allouée</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800 font-mono">
                  {batch.prizeTiers.map((tier) => (
                    <tr key={tier.id}>
                      <td className="px-4 py-2.5 font-sans font-semibold text-white">{tier.tierName}</td>
                      <td className="px-4 py-2.5 font-bold text-amber-400">
                        {tier.prizeAmountCents === 0 ? "0 HTG (Perdant)" : `${tier.prizeAmountCents / 100} ${batch.currency}`}
                      </td>
                      <td className="px-4 py-2.5">{(tier.probability * 100).toFixed(2)} %</td>
                      <td className="px-4 py-2.5 text-gray-400">1 sur {Math.round(1 / tier.probability)}</td>
                      <td className="px-4 py-2.5 text-gray-300">{tier.allocatedCount} tickets</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
