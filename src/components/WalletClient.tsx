"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency, Translations } from "@/lib/i18n";
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  Building,
  Smartphone,
  Info,
} from "lucide-react";

interface WalletClientProps {
  wallet: {
    balanceCents: number;
    pendingInCents: number;
    pendingOutCents: number;
    currency: string;
  };
  rechargeRequests: any[];
  withdrawalRequests: any[];
  t: Translations;
  locale: string;
}

export default function WalletClient({
  wallet,
  rechargeRequests,
  withdrawalRequests,
  t,
  locale,
}: WalletClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"recharge" | "withdraw" | "history">("recharge");

  // Formulaire Recharge
  const [rechargeAmount, setRechargeAmount] = useState("500");
  const [paymentMethod, setPaymentMethod] = useState("MONCASH");
  const [senderId, setSenderId] = useState("");
  const [proof, setProof] = useState("");
  const [rechargeLoading, setRechargeLoading] = useState(false);
  const [rechargeMsg, setRechargeMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Formulaire Retrait
  const [withdrawAmount, setWithdrawAmount] = useState("200");
  const [payoutMethod, setPayoutMethod] = useState("MONCASH");
  const [destinationAccount, setDestinationAccount] = useState("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawMsg, setWithdrawMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleRechargeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRechargeLoading(true);
    setRechargeMsg(null);

    try {
      const amountCents = Math.round(parseFloat(rechargeAmount) * 100);
      const res = await fetch("/api/wallet/recharge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountCents,
          paymentMethod,
          senderIdentifier: senderId,
          transactionProof: proof,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setRechargeMsg({ type: "error", text: data.error || "Erreur de recharge." });
      } else {
        setRechargeMsg({
          type: "success",
          text: `Demande de recharge soumise avec succès (Réf: ${data.request.reference}). Elle sera validée par l'administrateur.`,
        });
        setSenderId("");
        setProof("");
        router.refresh();
      }
    } catch {
      setRechargeMsg({ type: "error", text: "Erreur de connexion réseau." });
    } finally {
      setRechargeLoading(false);
    }
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawLoading(true);
    setWithdrawMsg(null);

    try {
      const amountCents = Math.round(parseFloat(withdrawAmount) * 100);
      const res = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountCents,
          payoutMethod,
          destinationAccount,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setWithdrawMsg({ type: "error", text: data.error || "Erreur lors du retrait." });
      } else {
        setWithdrawMsg({
          type: "success",
          text: `Demande de retrait enregistrée (Réf: ${data.withdrawal.reference}). Vos fonds disponibles sont réservés pour traitement.`,
        });
        setDestinationAccount("");
        router.refresh();
      }
    } catch {
      setWithdrawMsg({ type: "error", text: "Erreur de connexion réseau." });
    } finally {
      setWithdrawLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Résumé Portefeuille */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-950 to-gray-900 border border-indigo-500/40 space-y-2 shadow-xl">
          <div className="flex justify-between items-center text-xs text-gray-400 font-semibold">
            <span>{t.dashboard.availableBalance}</span>
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-white">
            {formatCurrency(wallet.balanceCents, wallet.currency, locale)}
          </div>
          <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 pt-1">
            <CheckCircle className="w-3.5 h-3.5" /> Immédiatement utilisable pour jouer
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-gray-900/80 border border-gray-800 space-y-2 shadow-xl">
          <div className="flex justify-between items-center text-xs text-gray-400 font-semibold">
            <span>{t.dashboard.pendingDeposits}</span>
            <ArrowDownLeft className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-black text-indigo-300">
            {formatCurrency(wallet.pendingInCents, wallet.currency, locale)}
          </div>
          <p className="text-[11px] text-gray-400 pt-1">Recharges manuelles soumises</p>
        </div>

        <div className="p-6 rounded-3xl bg-gray-900/80 border border-gray-800 space-y-2 shadow-xl">
          <div className="flex justify-between items-center text-xs text-gray-400 font-semibold">
            <span>{t.dashboard.pendingWithdrawals}</span>
            <ArrowUpRight className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-3xl font-black text-orange-300">
            {formatCurrency(wallet.pendingOutCents, wallet.currency, locale)}
          </div>
          <p className="text-[11px] text-gray-400 pt-1">Fonds bloqués en cours de paiement</p>
        </div>
      </div>

      {/* Onglets d'action */}
      <div className="flex border-b border-gray-800 gap-2">
        <button
          onClick={() => setActiveTab("recharge")}
          className={`px-5 py-3 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "recharge"
              ? "border-amber-500 text-amber-400"
              : "border-transparent text-gray-400 hover:text-white"
          }`}
        >
          <ArrowDownLeft className="w-4 h-4" />
          {t.wallet.rechargeTitle}
        </button>
        <button
          onClick={() => setActiveTab("withdraw")}
          className={`px-5 py-3 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "withdraw"
              ? "border-amber-500 text-amber-400"
              : "border-transparent text-gray-400 hover:text-white"
          }`}
        >
          <ArrowUpRight className="w-4 h-4" />
          {t.wallet.withdrawTitle}
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-5 py-3 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "history"
              ? "border-amber-500 text-amber-400"
              : "border-transparent text-gray-400 hover:text-white"
          }`}
        >
          {t.wallet.transactionsHistory}
        </button>
      </div>

      {/* Contenu Onglet Recharge */}
      {activeTab === "recharge" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <form onSubmit={handleRechargeSubmit} className="bg-gray-900/60 border border-gray-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-black text-white">{t.wallet.rechargeSubtitle}</h3>

            {rechargeMsg && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  rechargeMsg.type === "success"
                    ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                    : "bg-red-500/10 border border-red-500/30 text-red-400"
                }`}
              >
                {rechargeMsg.type === "success" ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{rechargeMsg.text}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-300">{t.wallet.selectAmount} ({wallet.currency})</label>
              <div className="grid grid-cols-4 gap-2">
                {["100", "250", "500", "1000"].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setRechargeAmount(amt)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                      rechargeAmount === amt
                        ? "bg-amber-500 text-gray-950 border-amber-400 shadow"
                        : "bg-gray-950 text-gray-300 border-gray-800 hover:border-gray-700"
                    }`}
                  >
                    {amt} G
                  </button>
                ))}
              </div>
              <input
                type="number"
                min="100"
                step="50"
                required
                value={rechargeAmount}
                onChange={(e) => setRechargeAmount(e.target.value)}
                className="w-full mt-2 px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-300">{t.wallet.paymentMethod}</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "MONCASH", name: "MonCash", icon: Smartphone },
                  { id: "NATCASH", name: "NatCash", icon: Smartphone },
                  { id: "BANK_TRANSFER", name: "Virement", icon: Building },
                ].map((m) => {
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id)}
                      className={`p-2.5 rounded-xl text-xs font-bold flex flex-col items-center gap-1 border transition-all ${
                        paymentMethod === m.id
                          ? "bg-indigo-600 text-white border-indigo-500 shadow"
                          : "bg-gray-950 text-gray-400 border-gray-800 hover:text-white"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{m.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-300">{t.wallet.senderNumber}</label>
              <input
                type="text"
                required
                value={senderId}
                onChange={(e) => setSenderId(e.target.value)}
                placeholder="ex: +509 37 XX XX XX"
                className="w-full px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-300">{t.wallet.transactionReference}</label>
              <input
                type="text"
                value={proof}
                onChange={(e) => setProof(e.target.value)}
                placeholder="ex: SMS ID / Réf reçue du transfert"
                className="w-full px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <button
              type="submit"
              disabled={rechargeLoading}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 font-black rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm"
            >
              {rechargeLoading ? t.common.loading : t.wallet.submitRecharge}
            </button>
          </form>

          {/* Instructions de dépôt manuel */}
          <div className="bg-gray-900/40 border border-gray-800 rounded-3xl p-6 space-y-4">
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <Info className="w-5 h-5 text-amber-400" />
              Procédure de recharge officielle
            </h4>
            <div className="space-y-3 text-xs text-gray-400 leading-relaxed">
              <div className="p-3 bg-gray-950 rounded-xl border border-gray-800 space-y-1">
                <span className="font-bold text-white">1. Effectuez votre dépôt :</span>
                <p>
                  Transférez vos fonds vers notre compte officiel <strong>MonCash</strong> ou <strong>NatCash</strong> agréé GRATIKO.
                </p>
                <p className="text-[11px] text-amber-300 font-mono">
                  Numéro officiel des dépôts : <strong>+509 37 00 00 00</strong>
                </p>
              </div>
              <div className="p-3 bg-gray-950 rounded-xl border border-gray-800 space-y-1">
                <span className="font-bold text-white">2. Soumettez le formulaire :</span>
                <p>Indiquez votre numéro et la référence SMS reçue.</p>
              </div>
              <div className="p-3 bg-gray-950 rounded-xl border border-gray-800 space-y-1">
                <span className="font-bold text-white">3. Vérification par un agent :</span>
                <p>L'administrateur confirme la réception et votre portefeuille est crédité atomiquement.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contenu Onglet Retrait */}
      {activeTab === "withdraw" && (
        <div className="max-w-md mx-auto bg-gray-900/60 border border-gray-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <h3 className="text-lg font-black text-white">{t.wallet.withdrawSubtitle}</h3>

          {withdrawMsg && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                withdrawMsg.type === "success"
                  ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                  : "bg-red-500/10 border border-red-500/30 text-red-400"
              }`}
            >
              {withdrawMsg.type === "success" ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{withdrawMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleWithdrawSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-300">Montant à retirer ({wallet.currency})</label>
              <input
                type="number"
                min="200"
                step="50"
                required
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
              />
              <span className="text-[11px] text-gray-500">Minimum: 200 HTG. Solde dispo: {formatCurrency(wallet.balanceCents, wallet.currency, locale)}</span>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-300">Moyen de réception</label>
              <select
                value={payoutMethod}
                onChange={(e) => setPayoutMethod(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
              >
                <option value="MONCASH">MonCash (+509)</option>
                <option value="NATCASH">NatCash (+509)</option>
                <option value="BANK_TRANSFER">Compte Bancaire (SOGEBANK / UNIBANK / BUH)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-300">{t.wallet.payoutDestination}</label>
              <input
                type="text"
                required
                value={destinationAccount}
                onChange={(e) => setDestinationAccount(e.target.value)}
                placeholder="Numéro de compte ou téléphone de réception"
                className="w-full px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <button
              type="submit"
              disabled={withdrawLoading}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 font-black rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm"
            >
              {withdrawLoading ? t.common.loading : t.wallet.submitWithdrawal}
            </button>
          </form>
        </div>
      )}

      {/* Contenu Onglet Historique */}
      {activeTab === "history" && (
        <div className="space-y-6">
          <div className="space-y-2">
            <h4 className="text-base font-bold text-white">Recharges Récentes</h4>
            <div className="overflow-x-auto rounded-2xl border border-gray-800">
              <table className="w-full text-left text-xs text-gray-300">
                <thead className="bg-gray-900/80 text-gray-400 uppercase font-semibold">
                  <tr>
                    <th className="px-4 py-3">Réf</th>
                    <th className="px-4 py-3">Montant</th>
                    <th className="px-4 py-3">Moyen</th>
                    <th className="px-4 py-3">Émetteur</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60 bg-gray-950/40">
                  {rechargeRequests.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-4 text-center text-gray-500">Aucune recharge demandée.</td>
                    </tr>
                  ) : (
                    rechargeRequests.map((r) => (
                      <tr key={r.id}>
                        <td className="px-4 py-3 font-mono text-gray-400">{r.reference}</td>
                        <td className="px-4 py-3 font-bold text-white">{formatCurrency(r.amountCents, r.currency, locale)}</td>
                        <td className="px-4 py-3">{r.paymentMethod}</td>
                        <td className="px-4 py-3 text-gray-400">{r.senderIdentifier}</td>
                        <td className="px-4 py-3 text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              r.status === "APPROVED"
                                ? "bg-emerald-500/20 text-emerald-400"
                                : r.status === "REJECTED"
                                ? "bg-red-500/20 text-red-400"
                                : "bg-amber-500/20 text-amber-300"
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-base font-bold text-white">Retraits Récents</h4>
            <div className="overflow-x-auto rounded-2xl border border-gray-800">
              <table className="w-full text-left text-xs text-gray-300">
                <thead className="bg-gray-900/80 text-gray-400 uppercase font-semibold">
                  <tr>
                    <th className="px-4 py-3">Réf</th>
                    <th className="px-4 py-3">Montant</th>
                    <th className="px-4 py-3">Moyen</th>
                    <th className="px-4 py-3">Destination</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60 bg-gray-950/40">
                  {withdrawalRequests.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-4 text-center text-gray-500">Aucun retrait demandé.</td>
                    </tr>
                  ) : (
                    withdrawalRequests.map((w) => (
                      <tr key={w.id}>
                        <td className="px-4 py-3 font-mono text-gray-400">{w.reference}</td>
                        <td className="px-4 py-3 font-bold text-white">{formatCurrency(w.amountCents, w.currency, locale)}</td>
                        <td className="px-4 py-3">{w.payoutMethod}</td>
                        <td className="px-4 py-3 text-gray-400">{w.destinationAccount}</td>
                        <td className="px-4 py-3 text-gray-400">{new Date(w.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              w.status === "PAID"
                                ? "bg-emerald-500/20 text-emerald-400"
                                : w.status === "REJECTED"
                                ? "bg-red-500/20 text-red-400"
                                : "bg-orange-500/20 text-orange-300"
                            }`}
                          >
                            {w.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
