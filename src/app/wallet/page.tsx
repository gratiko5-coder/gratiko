import React from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDictionary, Locale } from "@/lib/i18n";
import WalletClient from "@/components/WalletClient";

export default async function WalletPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login");
  }

  // Séparation stricte : les comptes administrateurs gèrent la trésorerie et sont redirigés vers /admin
  if (user.role !== "PLAYER") {
    redirect("/admin");
  }

  const cookieStore = await cookies();
  const locale = (cookieStore.get("NEXT_LOCALE")?.value as Locale) || "fr";
  const t = getDictionary(locale);

  // Charger le portefeuille à jour
  const wallet = await prisma.wallet.findUnique({
    where: { userId: user.id },
  });

  const rechargeRequests = await prisma.rechargeRequest.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const withdrawalRequests = await prisma.withdrawalRequest.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return (
    <div className="space-y-8 py-6">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="text-xs uppercase font-bold text-amber-400 tracking-wider">
          GESTION DES FONDS
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-white">{t.dashboard.walletTitle}</h1>
        <p className="text-xs sm:text-sm text-gray-400">
          Recharges manuelles vérifiées, retraits sécurisés et grand livre comptable transparent.
        </p>
      </div>

      <WalletClient
        wallet={
          wallet || {
            balanceCents: 0,
            pendingInCents: 0,
            pendingOutCents: 0,
            currency: user.currency,
          }
        }
        rechargeRequests={rechargeRequests}
        withdrawalRequests={withdrawalRequests}
        t={t}
        locale={locale}
      />
    </div>
  );
}
