import { prisma } from "./prisma";

export const ACCOUNT_CODES = {
  CASH_VAULT: "1010-CASH-VAULT",
  PLAYER_BALANCES: "2010-PLAYER-BALANCES",
  PENDING_WITHDRAWALS: "2020-PENDING-WITHDRAWALS",
  GROSS_SALES: "4010-GROSS-SALES",
  RESERVE_FUND: "5010-RESERVE-FUND",
  PRIZE_POOL: "5020-PRIZE-POOL",
  OPERATOR_COMMISSION: "7010-OPERATOR-COMMISSION",
};

export async function ensureStandardChartOfAccounts(countryCode: string = "HT", currency: string = "HTG") {
  const accounts = [
    { code: ACCOUNT_CODES.CASH_VAULT, name: "Trésorerie & Dépôts Reçus (Actif)", category: "ASSET" },
    { code: ACCOUNT_CODES.PLAYER_BALANCES, name: "Soldes & Gains Dus aux Joueurs (Passif)", category: "LIABILITY" },
    { code: ACCOUNT_CODES.PENDING_WITHDRAWALS, name: "Retraits en Attente d'Exécution (Passif)", category: "LIABILITY" },
    { code: ACCOUNT_CODES.GROSS_SALES, name: "Recettes Brutes de Vente de Tickets (Produit)", category: "REVENUE" },
    { code: ACCOUNT_CODES.RESERVE_FUND, name: "Fonds de Réserve Prudentiel 40% (Réserve)", category: "EQUITY" },
    { code: ACCOUNT_CODES.PRIZE_POOL, name: "Cagnotte Allouée aux Lots Gagnants (Passif)", category: "LIABILITY" },
    { code: ACCOUNT_CODES.OPERATOR_COMMISSION, name: "Commission Opérateur 20% (Produit Net)", category: "REVENUE" },
  ];

  for (const acc of accounts) {
    await prisma.ledgerAccount.upsert({
      where: { code: acc.code },
      update: { name: acc.name, category: acc.category, currency, countryCode },
      create: {
        code: acc.code,
        name: acc.name,
        category: acc.category,
        currency,
        countryCode,
      },
    });
  }
}

export interface BalancedEntry {
  accountCode: string;
  entryType: "DEBIT" | "CREDIT";
  amountCents: number;
}

export async function recordBalancedTransaction(params: {
  idempotencyKey: string;
  reference: string;
  description: string;
  transactionType: string;
  amountCents: number;
  currency?: string;
  countryCode?: string;
  relatedEntityId?: string;
  entries: BalancedEntry[];
}) {
  const currency = params.currency || "HTG";
  const countryCode = params.countryCode || "HT";

  // Vérification stricte d'équilibre comptable Débit == Crédit
  let totalDebit = 0;
  let totalCredit = 0;
  for (const entry of params.entries) {
    if (entry.entryType === "DEBIT") totalDebit += entry.amountCents;
    if (entry.entryType === "CREDIT") totalCredit += entry.amountCents;
  }

  if (totalDebit !== totalCredit) {
    throw new Error(
      `Déséquilibre comptable interdit: Total Débit (${totalDebit}) != Total Crédit (${totalCredit})`
    );
  }

  // Idempotence: si déjà enregistré, retourner la transaction existante
  const existing = await prisma.ledgerTransaction.findUnique({
    where: { idempotencyKey: params.idempotencyKey },
    include: { entries: true },
  });
  if (existing) {
    return existing;
  }

  // Résoudre les comptes
  const created = await prisma.$transaction(async (tx) => {
    const txRecord = await tx.ledgerTransaction.create({
      data: {
        idempotencyKey: params.idempotencyKey,
        reference: params.reference,
        description: params.description,
        transactionType: params.transactionType,
        amountCents: params.amountCents,
        currency,
        countryCode,
        relatedEntityId: params.relatedEntityId,
      },
    });

    for (const entry of params.entries) {
      const acc = await tx.ledgerAccount.findUnique({
        where: { code: entry.accountCode },
      });
      if (!acc) {
        throw new Error(`Compte comptable introuvable: ${entry.accountCode}`);
      }

      await tx.ledgerEntry.create({
        data: {
          transactionId: txRecord.id,
          accountId: acc.id,
          entryType: entry.entryType,
          amountCents: entry.amountCents,
          currency,
        },
      });
    }

    return txRecord;
  });

  return created;
}

/**
 * Calcul du modèle financier GRATIKO pour un ticket:
 * Vente: 100 HTG
 * Commission opérateur: 20% = 20 HTG
 * Allocation jeu: 80% = 80 HTG
 * Réserve quotidienne: 40% de 80 HTG = 32 HTG
 * Budget théorique de gain restant: 48 HTG
 */
export function calculateTicketFinancialSplit(priceCents: number) {
  const commissionCents = Math.round(priceCents * 0.20);
  const gameAllocationCents = priceCents - commissionCents; // 80%
  const reserveCents = Math.round(gameAllocationCents * 0.40); // 40% de 80%
  const prizeBudgetCents = gameAllocationCents - reserveCents; // 60% restant

  return {
    priceCents,
    commissionCents,
    gameAllocationCents,
    reserveCents,
    prizeBudgetCents,
  };
}

/**
 * Rapport et réconciliation financière du jour
 */
export async function getFinancialSummary(countryCode: string = "HT", currency: string = "HTG") {
  // Calculer le solde de chaque compte comptable
  const accounts = await prisma.ledgerAccount.findMany({
    where: { countryCode, currency },
    include: {
      entries: true,
    },
  });

  const accountBalances: Record<string, number> = {};
  for (const acc of accounts) {
    let balance = 0;
    for (const entry of acc.entries) {
      if (acc.category === "ASSET" || acc.category === "EXPENSE") {
        balance += entry.entryType === "DEBIT" ? entry.amountCents : -entry.amountCents;
      } else {
        // LIABILITY, EQUITY, REVENUE
        balance += entry.entryType === "CREDIT" ? entry.amountCents : -entry.amountCents;
      }
    }
    accountBalances[acc.code] = balance;
  }

  // Soldes réels en base
  const totalPlayerBalances = await prisma.wallet.aggregate({
    _sum: { balanceCents: true, pendingOutCents: true },
    where: { currency },
  });

  const playerObligationsCents = (totalPlayerBalances._sum.balanceCents || 0) + (totalPlayerBalances._sum.pendingOutCents || 0);
  const cashInVaultCents = accountBalances[ACCOUNT_CODES.CASH_VAULT] || 0;
  const reserveCents = accountBalances[ACCOUNT_CODES.RESERVE_FUND] || 0;
  const operatorCommissionCents = accountBalances[ACCOUNT_CODES.OPERATOR_COMMISSION] || 0;
  const prizePoolCents = accountBalances[ACCOUNT_CODES.PRIZE_POOL] || 0;
  // Total tickets vendus et ventes brutes
  const totalTicketsSold = await prisma.ticket.count({
    where: { countryCode, currency },
  });

  const totalSalesAgg = await prisma.ticket.aggregate({
    _sum: { priceCents: true },
    where: { countryCode, currency },
  });
  const grossSalesCents = totalSalesAgg._sum.priceCents || 0;

  // Total des gains payés ou crédités
  const totalPrizesAwarded = await prisma.ticket.aggregate({
    _sum: { prizeAmountCents: true },
    where: { countryCode, currency, isWinner: true },
  });

  const prizesAwardedCents = totalPrizesAwarded._sum.prizeAmountCents || 0;

  // Indicateur de solvabilité: Trésorerie disponible vs obligations immédiates envers les joueurs
  // Si trésorerie < obligations, alerte de solvabilité
  const isSolvent = cashInVaultCents >= playerObligationsCents;
  const discrepancyCents = Math.abs(cashInVaultCents - playerObligationsCents - reserveCents - operatorCommissionCents);

  return {
    currency,
    countryCode,
    grossSalesCents,
    totalTicketsSold,
    operatorCommissionCents,
    reserveCents,
    prizePoolCents,
    prizesAwardedCents,
    playerObligationsCents,
    cashInVaultCents,
    isSolvent,
    discrepancyCents,
    accountBalances,
  };
}
