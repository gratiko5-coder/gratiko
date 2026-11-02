import React from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDictionary, Locale } from "@/lib/i18n";
import { getFinancialSummary } from "@/lib/finance";
import AdminClient from "@/components/AdminClient";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role, ["SUPER_ADMIN", "COUNTRY_ADMIN", "VERIFIER", "AUDITOR"])) {
    redirect("/dashboard");
  }

  const cookieStore = await cookies();
  const locale = (cookieStore.get("NEXT_LOCALE")?.value as Locale) || "fr";
  const t = getDictionary(locale);

  // Synthèse financière temps réel
  const summary = await getFinancialSummary(user.countryCode, user.currency);

  // Recharges en attente
  const pendingRecharges = await prisma.rechargeRequest.findMany({
    where: { status: "PENDING" },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });

  // Retraits en attente
  const pendingWithdrawals = await prisma.withdrawalRequest.findMany({
    where: { status: "REQUESTED" },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });

  // Lots de tickets et probabilités
  const ticketBatches = await prisma.ticketBatch.findMany({
    include: {
      ticketType: true,
      prizeTiers: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Marchés configurés
  const countryMarkets = await prisma.countryMarket.findMany();

  // Derniers logs d'audit
  const auditLogs = await prisma.auditLog.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <div className="space-y-8 py-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-bold text-amber-400 tracking-wider">
            CONSOLE DE SUPERVISION FINANCIÈRE
          </span>
          <h1 className="text-3xl font-black text-white">{t.admin.title}</h1>
          <p className="text-xs text-gray-400">
            Connecté en tant que <strong>{user.fullName}</strong> ({user.role}) • Marché: {user.countryCode}
          </p>
        </div>
      </div>

      <AdminClient
        summary={summary}
        pendingRecharges={pendingRecharges}
        pendingWithdrawals={pendingWithdrawals}
        auditLogs={auditLogs}
        ticketBatches={ticketBatches}
        countryMarkets={countryMarkets}
        t={t}
        locale={locale}
      />
    </div>
  );
}
