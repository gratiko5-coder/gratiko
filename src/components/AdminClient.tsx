"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency, Translations } from "@/lib/i18n";
import {
  ShieldAlert,
  CheckCircle,
  XCircle,
  FileText,
  Lock,
  Layers,
  Activity,
  AlertTriangle,
} from "lucide-react";

interface AdminClientProps {
  summary: any;
  pendingRecharges: any[];
  pendingWithdrawals: any[];
  auditLogs: any[];
  ticketBatches: any[];
  countryMarkets: any[];
  t: Translations;
  locale: string;
}

export default function AdminClient({
  summary,
  pendingRecharges,
  pendingWithdrawals,
  auditLogs,
  ticketBatches,
  countryMarkets,
  t,
  locale,
}: AdminClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "recharges" | "withdrawals" | "batches" | "audit">("overview");

  // Traitement Recharge
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rechargeNotes, setRechargeNotes] = useState<Record<string, string>>({});
  const [payoutRefs, setPayoutRefs] = useState<Record<string, string>>({});

  const handleReviewRecharge = async (requestId: string, action: "APPROVE" | "REJECT") => {
    setActionLoading(`recharge_${requestId}`);
    try {
      const res = await fetch("/api/admin/recharges/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          action,
          notes: rechargeNotes[requestId] || "",
        }),
      });

      if (res.ok) {
        router.refresh();
      } else {
        const err = await res.json();
        alert(`Erreur: ${err.error}`);
      }
    } catch {
      alert("Erreur de connexion");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReviewWithdrawal = async (withdrawalId: string, action: "MARK_PAID" | "REJECT") => {
    if (action === "MARK_PAID" && !payoutRefs[withdrawalId]) {
      alert("Veuillez saisir la référence de virement / MonCash réelle.");
      return;
    }

    setActionLoading(`withdraw_${withdrawalId}`);
    try {
      const res = await fetch("/api/admin/withdrawals/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          withdrawalId,
          action,
          payoutReference: payoutRefs[withdrawalId] || "",
          notes: "",
        }),
      });

      if (res.ok) {
        router.refresh();
      } else {
        const err = await res.json();
        alert(`Erreur: ${err.error}`);
      }
    } catch {
      alert("Erreur de connexion");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Alertes de solvabilité financière */}
      {!summary.isSolvent ? (
        <div className="p-4 bg-red-500/20 border border-red-500 rounded-2xl text-red-200 flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-red-400 shrink-0" />
          <div>
            <h4 className="font-bold text-sm">ALERTE CRITIQUE DE SOLVABILITÉ</h4>
            <p className="text-xs">
              La trésorerie réelle en coffre est inférieure aux obligations des soldes joueurs. Les ventes doivent être régulées.
            </p>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-300 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>
              <strong>Indicateur de solvabilité sain :</strong> La trésorerie couvre l'intégralité des obligations envers les joueurs ({formatCurrency(summary.playerObligationsCents, summary.currency, locale)}).
            </span>
          </div>
          <span className="font-mono bg-emerald-950 px-2.5 py-1 rounded-lg border border-emerald-500/20 font-bold">
            SOLVABLE
          </span>
        </div>
      )}

      {/* Cartes Métriques Financières du Grand Livre */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Recettes Brutes de Vente */}
        <div className="p-5 rounded-2xl bg-gray-900 border border-gray-800 space-y-1">
          <span className="text-xs text-gray-400 font-semibold">{t.admin.grossSales}</span>
          <div className="text-2xl font-black text-white">
            {formatCurrency(summary.grossSalesCents, summary.currency, locale)}
          </div>
          <p className="text-[11px] text-gray-500 font-mono">{summary.totalTicketsSold} tickets vendus</p>
        </div>

        {/* Commission Opérateur 20% */}
        <div className="p-5 rounded-2xl bg-indigo-950/60 border border-indigo-500/30 space-y-1">
          <span className="text-xs text-indigo-300 font-semibold">{t.admin.operatorCommission}</span>
          <div className="text-2xl font-black text-indigo-200">
            {formatCurrency(summary.operatorCommissionCents, summary.currency, locale)}
          </div>
          <p className="text-[11px] text-indigo-400">20% des ventes admissibles</p>
        </div>

        {/* Fonds de Réserve Prudentiel 40% */}
        <div className="p-5 rounded-2xl bg-amber-950/40 border border-amber-500/30 space-y-1">
          <span className="text-xs text-amber-300 font-semibold">{t.admin.reserveFund}</span>
          <div className="text-2xl font-black text-amber-400">
            {formatCurrency(summary.reserveCents, summary.currency, locale)}
          </div>
          <p className="text-[11px] text-amber-400">40% de l'allocation jeu (sécurisé)</p>
        </div>

        {/* Trésorerie en Coffre */}
        <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 space-y-1">
          <span className="text-xs text-emerald-300 font-semibold">{t.admin.availableCash}</span>
          <div className="text-2xl font-black text-emerald-400">
            {formatCurrency(summary.cashInVaultCents, summary.currency, locale)}
          </div>
          <p className="text-[11px] text-emerald-400">Dépôts réels validés</p>
        </div>
      </div>

      {/* Onglets Navigation Administration */}
      <div className="flex border-b border-gray-800 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-3 font-bold text-xs sm:text-sm border-b-2 whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === "overview" ? "border-amber-500 text-amber-400" : "border-transparent text-gray-400 hover:text-white"
          }`}
        >
          <Activity className="w-4 h-4" />
          Grand Livre & Solvabilité
        </button>
        <button
          onClick={() => setActiveTab("recharges")}
          className={`px-4 py-3 font-bold text-xs sm:text-sm border-b-2 whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === "recharges" ? "border-amber-500 text-amber-400" : "border-transparent text-gray-400 hover:text-white"
          }`}
        >
          <CheckCircle className="w-4 h-4" />
          {t.admin.rechargeQueue} ({pendingRecharges.length})
        </button>
        <button
          onClick={() => setActiveTab("withdrawals")}
          className={`px-4 py-3 font-bold text-xs sm:text-sm border-b-2 whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === "withdrawals" ? "border-amber-500 text-amber-400" : "border-transparent text-gray-400 hover:text-white"
          }`}
        >
          <Lock className="w-4 h-4" />
          {t.admin.withdrawalQueue} ({pendingWithdrawals.length})
        </button>
        <button
          onClick={() => setActiveTab("batches")}
          className={`px-4 py-3 font-bold text-xs sm:text-sm border-b-2 whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === "batches" ? "border-amber-500 text-amber-400" : "border-transparent text-gray-400 hover:text-white"
          }`}
        >
          <Layers className="w-4 h-4" />
          {t.admin.batchManagement}
        </button>
        <button
          onClick={() => setActiveTab("audit")}
          className={`px-4 py-3 font-bold text-xs sm:text-sm border-b-2 whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === "audit" ? "border-amber-500 text-amber-400" : "border-transparent text-gray-400 hover:text-white"
          }`}
        >
          <FileText className="w-4 h-4" />
          {t.admin.auditLog}
        </button>
      </div>

      {/* Onglet 1: Grand Livre & Solvabilité */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-900/60 border border-gray-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-black text-white">Balances des Comptes du Grand Livre</h3>
            <div className="space-y-2 text-xs">
              {Object.entries(summary.accountBalances).map(([code, bal]: [string, any]) => (
                <div key={code} className="flex justify-between items-center py-2 border-b border-gray-800">
                  <span className="font-mono text-gray-300">{code}</span>
                  <span className="font-bold text-white">{formatCurrency(bal, summary.currency, locale)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-900/60 border border-gray-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-black text-white">Marchés & Paramètres Régionaux</h3>
            <div className="space-y-3">
              {countryMarkets.map((cm) => (
                <div key={cm.code} className="p-3 bg-gray-950 rounded-2xl border border-gray-800 space-y-1 text-xs">
                  <div className="flex justify-between font-bold text-white">
                    <span>{cm.name} ({cm.code})</span>
                    <span className="text-amber-400">{cm.currency}</span>
                  </div>
                  <p className="text-gray-400 text-[11px]">Fuseau : {cm.timezone}</p>
                  <p className="text-gray-400 text-[11px]">Recharge min: {formatCurrency(cm.minRechargeCents, cm.currency, locale)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Onglet 2: File des Recharges */}
      {activeTab === "recharges" && (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-2xl border border-gray-800">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-gray-900/80 text-gray-400 uppercase font-semibold">
                <tr>
                  <th className="px-4 py-3">Réf</th>
                  <th className="px-4 py-3">Joueur</th>
                  <th className="px-4 py-3">Montant</th>
                  <th className="px-4 py-3">Moyen</th>
                  <th className="px-4 py-3">Émetteur</th>
                  <th className="px-4 py-3">Preuve SMS</th>
                  <th className="px-4 py-3">Actions de décision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 bg-gray-950/40">
                {pendingRecharges.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                      Aucune recharge en attente de vérification.
                    </td>
                  </tr>
                ) : (
                  pendingRecharges.map((r) => (
                    <tr key={r.id}>
                      <td className="px-4 py-3 font-mono text-gray-400">{r.reference}</td>
                      <td className="px-4 py-3 font-medium text-white">{r.user?.fullName}</td>
                      <td className="px-4 py-3 font-bold text-amber-400">{formatCurrency(r.amountCents, r.currency, locale)}</td>
                      <td className="px-4 py-3">{r.paymentMethod}</td>
                      <td className="px-4 py-3 text-gray-400">{r.senderIdentifier}</td>
                      <td className="px-4 py-3 font-mono text-[11px] text-gray-400">{r.transactionProof || "Aucune"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            disabled={actionLoading === `recharge_${r.id}`}
                            onClick={() => handleReviewRecharge(r.id, "APPROVE")}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[11px] transition-all"
                          >
                            Valider & Créditer
                          </button>
                          <button
                            disabled={actionLoading === `recharge_${r.id}`}
                            onClick={() => handleReviewRecharge(r.id, "REJECT")}
                            className="px-3 py-1 bg-red-600/80 hover:bg-red-600 text-white font-bold rounded-lg text-[11px] transition-all"
                          >
                            Refuser
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Onglet 3: File des Retraits */}
      {activeTab === "withdrawals" && (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-2xl border border-gray-800">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-gray-900/80 text-gray-400 uppercase font-semibold">
                <tr>
                  <th className="px-4 py-3">Réf</th>
                  <th className="px-4 py-3">Joueur</th>
                  <th className="px-4 py-3">Montant</th>
                  <th className="px-4 py-3">Moyen</th>
                  <th className="px-4 py-3">Destination</th>
                  <th className="px-4 py-3">Réf Virement Réel</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 bg-gray-950/40">
                {pendingWithdrawals.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                      Aucun retrait en attente de traitement.
                    </td>
                  </tr>
                ) : (
                  pendingWithdrawals.map((w) => (
                    <tr key={w.id}>
                      <td className="px-4 py-3 font-mono text-gray-400">{w.reference}</td>
                      <td className="px-4 py-3 font-medium text-white">{w.user?.fullName}</td>
                      <td className="px-4 py-3 font-bold text-orange-400">{formatCurrency(w.amountCents, w.currency, locale)}</td>
                      <td className="px-4 py-3">{w.payoutMethod}</td>
                      <td className="px-4 py-3 font-mono text-gray-400">{w.destinationAccount}</td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          placeholder="Code SMS virement"
                          value={payoutRefs[w.id] || ""}
                          onChange={(e) => setPayoutRefs({ ...payoutRefs, [w.id]: e.target.value })}
                          className="px-2 py-1 bg-gray-950 border border-gray-800 rounded text-xs text-white"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            disabled={actionLoading === `withdraw_${w.id}`}
                            onClick={() => handleReviewWithdrawal(w.id, "MARK_PAID")}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[11px] transition-all"
                          >
                            Marquer Payé
                          </button>
                          <button
                            disabled={actionLoading === `withdraw_${w.id}`}
                            onClick={() => handleReviewWithdrawal(w.id, "REJECT")}
                            className="px-3 py-1 bg-red-600/80 hover:bg-red-600 text-white font-bold rounded-lg text-[11px] transition-all"
                          >
                            Rejeter & Rembourser
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Onglet 4: Gestion des Lots & Probabilités */}
      {activeTab === "batches" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ticketBatches.map((b) => (
              <div key={b.id} className="p-5 rounded-2xl bg-gray-900 border border-gray-800 space-y-3 text-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-amber-400">{b.batchNumber}</span>
                    <h4 className="text-base font-bold text-white">{b.ticketType.name}</h4>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400">
                    {b.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-gray-400">
                  <div>Vendus: <strong className="text-white">{b.ticketsSold} / {b.totalTickets}</strong></div>
                  <div>Budget Gains: <strong className="text-amber-400">{formatCurrency(b.maxPrizeBudgetCents, b.currency, locale)}</strong></div>
                </div>
                <div className="pt-2 border-t border-gray-800 space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Paliers de gains :</span>
                  {b.prizeTiers.map((pt: any) => (
                    <div key={pt.id} className="flex justify-between text-[11px] text-gray-400">
                      <span>{pt.displayLabel}</span>
                      <span className="font-mono">{(pt.probability * 100).toFixed(1)}% ({pt.remainingCount} restants)</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Onglet 5: Journal d'Audit */}
      {activeTab === "audit" && (
        <div className="overflow-x-auto rounded-2xl border border-gray-800">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-gray-900/80 text-gray-400 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Utilisateur</th>
                <th className="px-4 py-3">Ressource</th>
                <th className="px-4 py-3">Détails</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 bg-gray-950/40 font-mono text-[11px]">
              {auditLogs.map((log) => (
                <tr key={log.id}>
                  <td className="px-4 py-2.5 text-gray-400">{new Date(log.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-2.5 font-bold text-amber-400">{log.action}</td>
                  <td className="px-4 py-2.5 text-gray-300">{log.user?.fullName || log.userId}</td>
                  <td className="px-4 py-2.5 text-gray-400">{log.resource}</td>
                  <td className="px-4 py-2.5 text-gray-400 truncate max-w-xs">{log.details || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
