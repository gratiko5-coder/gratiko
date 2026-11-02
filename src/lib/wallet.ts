import { prisma } from "./prisma";
import { recordBalancedTransaction, ACCOUNT_CODES } from "./finance";

/**
 * Traitement d'une demande de recharge manuelle
 */
export async function createRechargeRequest(params: {
  userId: string;
  amountCents: number;
  paymentMethod: string;
  senderIdentifier: string;
  transactionProof?: string;
  currency?: string;
  countryCode?: string;
}) {
  const currency = params.currency || "HTG";
  const countryCode = params.countryCode || "HT";

  if (params.amountCents <= 0) {
    throw new Error("Le montant de recharge doit être supérieur à zéro.");
  }

  const reference = `RCH-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

  const request = await prisma.rechargeRequest.create({
    data: {
      reference,
      userId: params.userId,
      amountCents: params.amountCents,
      paymentMethod: params.paymentMethod,
      senderIdentifier: params.senderIdentifier,
      transactionProof: params.transactionProof,
      status: "PENDING",
      currency,
      countryCode,
    },
  });

  // Mettre à jour pendingInCents sur le portefeuille
  await prisma.wallet.update({
    where: { userId: params.userId },
    data: {
      pendingInCents: { increment: params.amountCents },
    },
  });

  return request;
}

/**
 * Approbation administrative d'une recharge manuelle (Protection stricte contre double approbation)
 */
export async function approveRechargeRequest(params: {
  requestId: string;
  adminUserId: string;
  notes?: string;
}) {
  return await prisma.$transaction(async (tx) => {
    const request = await tx.rechargeRequest.findUnique({
      where: { id: params.requestId },
      include: { user: { include: { wallet: true } } },
    });

    if (!request) {
      throw new Error("Demande de recharge introuvable.");
    }

    if (request.status !== "PENDING" && request.status !== "UNDER_REVIEW") {
      throw new Error(`Cette recharge ne peut pas être approuvée (Statut actuel: ${request.status}).`);
    }

    // Mettre à jour la demande
    const updatedRequest = await tx.rechargeRequest.update({
      where: { id: params.requestId },
      data: {
        status: "APPROVED",
        reviewedByUserId: params.adminUserId,
        reviewedAt: new Date(),
        adminNotes: params.notes,
      },
    });

    // Créditer atomiquement le portefeuille du joueur
    await tx.wallet.update({
      where: { userId: request.userId },
      data: {
        balanceCents: { increment: request.amountCents },
        pendingInCents: { decrement: request.amountCents },
      },
    });

    // Enregistrer l'écriture au Grand Livre : Débit Trésorerie, Crédit Soldes Joueurs
    const idempotencyKey = `RECHARGE_APPROVE_${request.id}`;
    
    // Notification joueur
    await tx.notification.create({
      data: {
        userId: request.userId,
        title: "Recharge approuvée",
        message: `Votre recharge de ${request.amountCents / 100} ${request.currency} a été validée avec succès.`,
        type: "SUCCESS",
      },
    });

    // Audit log
    await tx.auditLog.create({
      data: {
        userId: params.adminUserId,
        action: "RECHARGE_APPROVED",
        resource: "RechargeRequest",
        resourceId: request.id,
        details: JSON.stringify({
          amountCents: request.amountCents,
          targetUser: request.userId,
          reference: request.reference,
        }),
      },
    });

    return updatedRequest;
  }).then(async (req) => {
    // Grand livre
    await recordBalancedTransaction({
      idempotencyKey: `RECHARGE_APPROVE_${req.id}`,
      reference: req.reference,
      description: `Dépôt manuel validé pour ${req.senderIdentifier}`,
      transactionType: "RECHARGE_DEPOSIT",
      amountCents: req.amountCents,
      currency: req.currency,
      countryCode: req.countryCode,
      relatedEntityId: req.id,
      entries: [
        { accountCode: ACCOUNT_CODES.CASH_VAULT, entryType: "DEBIT", amountCents: req.amountCents },
        { accountCode: ACCOUNT_CODES.PLAYER_BALANCES, entryType: "CREDIT", amountCents: req.amountCents },
      ],
    });
    return req;
  });
}

/**
 * Rejet d'une demande de recharge
 */
export async function rejectRechargeRequest(params: {
  requestId: string;
  adminUserId: string;
  reason: string;
}) {
  return await prisma.$transaction(async (tx) => {
    const request = await tx.rechargeRequest.findUnique({
      where: { id: params.requestId },
    });

    if (!request || (request.status !== "PENDING" && request.status !== "UNDER_REVIEW")) {
      throw new Error("Demande déjà traitée ou invalide.");
    }

    const updated = await tx.rechargeRequest.update({
      where: { id: params.requestId },
      data: {
        status: "REJECTED",
        reviewedByUserId: params.adminUserId,
        reviewedAt: new Date(),
        adminNotes: params.reason,
      },
    });

    // Décrémenter le pendingInCents
    await tx.wallet.update({
      where: { userId: request.userId },
      data: {
        pendingInCents: { decrement: request.amountCents },
      },
    });

    await tx.notification.create({
      data: {
        userId: request.userId,
        title: "Recharge refusée",
        message: `Votre demande de recharge a été refusée: ${params.reason}`,
        type: "WARNING",
      },
    });

    return updated;
  });
}

/**
 * Création d'une demande de retrait (Verrouille immédiatement le montant disponible)
 */
export async function createWithdrawalRequest(params: {
  userId: string;
  amountCents: number;
  payoutMethod: string;
  destinationAccount: string;
  currency?: string;
  countryCode?: string;
}) {
  const currency = params.currency || "HTG";
  const countryCode = params.countryCode || "HT";

  if (params.amountCents < 20000) {
    throw new Error("Le montant minimum de retrait est de 200 HTG.");
  }

  return await prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.findUnique({
      where: { userId: params.userId },
    });

    if (!wallet || wallet.balanceCents < params.amountCents) {
      throw new Error("Solde disponible insuffisant pour ce montant de retrait.");
    }

    // Verrouiller les fonds: débiter balanceCents disponible et créditer pendingOutCents
    await tx.wallet.update({
      where: { userId: params.userId },
      data: {
        balanceCents: { decrement: params.amountCents },
        pendingOutCents: { increment: params.amountCents },
      },
    });

    const reference = `WTH-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    const withdrawal = await tx.withdrawalRequest.create({
      data: {
        reference,
        userId: params.userId,
        amountCents: params.amountCents,
        payoutMethod: params.payoutMethod,
        destinationAccount: params.destinationAccount,
        status: "REQUESTED",
        currency,
        countryCode,
      },
    });

    return withdrawal;
  });
}

/**
 * Validation et paiement effectif du retrait par l'administrateur
 */
export async function markWithdrawalAsPaid(params: {
  withdrawalId: string;
  adminUserId: string;
  payoutReference: string;
  notes?: string;
}) {
  return await prisma.$transaction(async (tx) => {
    const withdrawal = await tx.withdrawalRequest.findUnique({
      where: { id: params.withdrawalId },
    });

    if (!withdrawal) {
      throw new Error("Demande de retrait introuvable.");
    }

    if (withdrawal.status !== "REQUESTED" && withdrawal.status !== "APPROVED") {
      throw new Error(`Ce retrait ne peut pas être payé (Statut: ${withdrawal.status}).`);
    }

    const updated = await tx.withdrawalRequest.update({
      where: { id: params.withdrawalId },
      data: {
        status: "PAID",
        paidAt: new Date(),
        reviewedByUserId: params.adminUserId,
        reviewedAt: new Date(),
        payoutReference: params.payoutReference,
        adminNotes: params.notes,
      },
    });

    // Libérer les fonds verrouillés du portefeuille
    await tx.wallet.update({
      where: { userId: withdrawal.userId },
      data: {
        pendingOutCents: { decrement: withdrawal.amountCents },
      },
    });

    await tx.notification.create({
      data: {
        userId: withdrawal.userId,
        title: "Retrait envoyé",
        message: `Votre retrait de ${withdrawal.amountCents / 100} ${withdrawal.currency} a été payé (Réf: ${params.payoutReference}).`,
        type: "SUCCESS",
      },
    });

    await tx.auditLog.create({
      data: {
        userId: params.adminUserId,
        action: "WITHDRAWAL_PAID",
        resource: "WithdrawalRequest",
        resourceId: withdrawal.id,
        details: JSON.stringify({
          amountCents: withdrawal.amountCents,
          payoutReference: params.payoutReference,
        }),
      },
    });

    return updated;
  }).then(async (wth) => {
    // Grand livre: Débit Passif Joueur, Crédit Trésorerie
    await recordBalancedTransaction({
      idempotencyKey: `WITHDRAWAL_PAID_${wth.id}`,
      reference: wth.reference,
      description: `Paiement de retrait exécuté vers ${wth.destinationAccount}`,
      transactionType: "WITHDRAWAL_PAYOUT",
      amountCents: wth.amountCents,
      currency: wth.currency,
      countryCode: wth.countryCode,
      relatedEntityId: wth.id,
      entries: [
        { accountCode: ACCOUNT_CODES.PLAYER_BALANCES, entryType: "DEBIT", amountCents: wth.amountCents },
        { accountCode: ACCOUNT_CODES.CASH_VAULT, entryType: "CREDIT", amountCents: wth.amountCents },
      ],
    });
    return wth;
  });
}
