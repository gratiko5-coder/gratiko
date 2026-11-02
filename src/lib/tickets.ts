import { prisma } from "./prisma";
import { getRandomInt, generateSymbolsForOutcome } from "./rng";
import { recordBalancedTransaction, calculateTicketFinancialSplit, ACCOUNT_CODES } from "./finance";

/**
 * Achat d'un ticket avec idempotencyKey et tirage sécurisé du résultat
 */
export async function purchaseTicket(params: {
  userId: string;
  ticketTypeId: string;
  idempotencyKey: string;
}) {
  // Vérifier idempotence
  const existingTicket = await prisma.ticket.findUnique({
    where: { purchaseIdempotencyKey: params.idempotencyKey },
    include: { ticketType: true },
  });
  if (existingTicket) {
    return existingTicket;
  }

  return await prisma.$transaction(async (tx) => {
    // 1. Charger l'utilisateur et son portefeuille
    const wallet = await tx.wallet.findUnique({
      where: { userId: params.userId },
    });
    if (!wallet) throw new Error("Portefeuille introuvable.");

    // 2. Charger le type de ticket
    const ticketType = await tx.ticketType.findUnique({
      where: { id: params.ticketTypeId },
      include: {
        batches: {
          where: { status: "ACTIVE" },
          include: { prizeTiers: true },
        },
      },
    });

    if (!ticketType || !ticketType.isActive) {
      throw new Error("Ce type de ticket n'est pas disponible actuellement.");
    }

    if (wallet.balanceCents < ticketType.priceCents) {
      throw new Error("Solde insuffisant pour acheter ce ticket.");
    }

    // 3. Trouver un lot actif ayant des tickets restants
    const batch = ticketType.batches[0];
    if (!batch || batch.prizeTiers.length === 0) {
      throw new Error("Aucun lot de tickets n'est actuellement disponible à la vente.");
    }

    // 4. Déterminer le palier de gain de manière cryptographiquement sécurisée selon les probabilités
    const tiers = batch.prizeTiers.filter((t) => t.remainingCount > 0);
    if (tiers.length === 0) {
      throw new Error("Ce lot de tickets est épuisé. Un nouveau lot doit être ouvert.");
    }

    // Tirage pondéré par remainingCount
    const totalRemaining = tiers.reduce((sum, t) => sum + t.remainingCount, 0);
    const chosenTicketIndex = getRandomInt(0, totalRemaining);

    let accumulated = 0;
    let selectedTier = tiers[0];
    for (const t of tiers) {
      accumulated += t.remainingCount;
      if (chosenTicketIndex < accumulated) {
        selectedTier = t;
        break;
      }
    }

    // Décrémenter le remainingCount du palier et incrémenter les tickets vendus
    await tx.prizeTierConfig.update({
      where: { id: selectedTier.id },
      data: { remainingCount: { decrement: 1 } },
    });

    const newSold = batch.ticketsSold + 1;
    await tx.ticketBatch.update({
      where: { id: batch.id },
      data: {
        ticketsSold: { increment: 1 },
        status: newSold >= batch.totalTickets ? "EXHAUSTED" : "ACTIVE",
      },
    });

    // 5. Débiter immédiatement le prix du ticket du portefeuille du joueur
    await tx.wallet.update({
      where: { userId: params.userId },
      data: {
        balanceCents: { decrement: ticketType.priceCents },
      },
    });

    // 6. Générer les symboles et sceller le résultat immuable
    // Si palier JACKPOT, ajouter le bonus de la cagnotte évolutive alimentée par les 40% de réserve (32% du prix des tickets vendus)
    const isWinner = selectedTier.prizeAmountCents > 0;
    let finalPrizeAmountCents = selectedTier.prizeAmountCents;
    if (isWinner && selectedTier.tierName.includes("JACKPOT")) {
      const progressiveReserveBonus = Math.round(batch.ticketsSold * ticketType.priceCents * 0.32);
      finalPrizeAmountCents += progressiveReserveBonus;
    }

    const symbols = generateSymbolsForOutcome(isWinner, finalPrizeAmountCents);

    const ticketNumber = `TKT-${ticketType.slug.toUpperCase()}-${Date.now().toString().slice(-6)}-${getRandomInt(1000, 9999)}`;

    const newTicket = await tx.ticket.create({
      data: {
        ticketNumber,
        userId: params.userId,
        ticketTypeId: ticketType.id,
        batchId: batch.id,
        priceCents: ticketType.priceCents,
        currency: ticketType.currency,
        countryCode: ticketType.countryCode,
        isWinner,
        prizeAmountCents: finalPrizeAmountCents,
        tierName: selectedTier.tierName,
        symbolsPattern: JSON.stringify(symbols),
        status: "PURCHASED",
        purchaseIdempotencyKey: params.idempotencyKey,
      },
      include: {
        ticketType: true,
      },
    });

    return newTicket;
  }).then(async (ticket) => {
    // Écritures comptables double entrée pour la vente du ticket et répartition financière
    const split = calculateTicketFinancialSplit(ticket.priceCents);

    await recordBalancedTransaction({
      idempotencyKey: `TICKET_SALE_${ticket.id}`,
      reference: ticket.ticketNumber,
      description: `Vente de ticket ${ticket.ticketType.name}`,
      transactionType: "TICKET_PURCHASE",
      amountCents: ticket.priceCents,
      currency: ticket.currency,
      countryCode: ticket.countryCode,
      relatedEntityId: ticket.id,
      entries: [
        // 1. Débit passif joueur (solde consommé) & Crédit Recettes Brutes
        { accountCode: ACCOUNT_CODES.PLAYER_BALANCES, entryType: "DEBIT", amountCents: ticket.priceCents },
        { accountCode: ACCOUNT_CODES.GROSS_SALES, entryType: "CREDIT", amountCents: ticket.priceCents },
      ],
    });

    // Répartition de la recette: 20% commission, 40% de 80% réserve, 60% de 80% cagnotte
    await recordBalancedTransaction({
      idempotencyKey: `TICKET_ALLOCATION_${ticket.id}`,
      reference: `ALLOC-${ticket.ticketNumber}`,
      description: `Ventilation financière 20% Comm / 32% Réserve / 48% Jeu`,
      transactionType: "COMMISSION_ALLOCATION",
      amountCents: ticket.priceCents,
      currency: ticket.currency,
      countryCode: ticket.countryCode,
      relatedEntityId: ticket.id,
      entries: [
        { accountCode: ACCOUNT_CODES.GROSS_SALES, entryType: "DEBIT", amountCents: ticket.priceCents },
        { accountCode: ACCOUNT_CODES.OPERATOR_COMMISSION, entryType: "CREDIT", amountCents: split.commissionCents },
        { accountCode: ACCOUNT_CODES.RESERVE_FUND, entryType: "CREDIT", amountCents: split.reserveCents },
        { accountCode: ACCOUNT_CODES.PRIZE_POOL, entryType: "CREDIT", amountCents: split.prizeBudgetCents },
      ],
    });

    return ticket;
  });
}

/**
 * Grattage et révélation du ticket (Le résultat scellé est immuable)
 */
export async function revealAndClaimTicket(params: {
  ticketId: string;
  userId: string;
}) {
  return await prisma.$transaction(async (tx) => {
    const ticket = await tx.ticket.findUnique({
      where: { id: params.ticketId },
      include: { ticketType: true },
    });

    if (!ticket) throw new Error("Ticket introuvable.");
    if (ticket.userId !== params.userId) throw new Error("Accès non autorisé à ce ticket.");

    // Si déjà réclamé, retourner le ticket
    if (ticket.status === "CLAIMED") {
      return ticket;
    }

    const updated = await tx.ticket.update({
      where: { id: ticket.id },
      data: {
        status: "CLAIMED",
        scratchedAt: ticket.scratchedAt || new Date(),
        claimedAt: new Date(),
      },
      include: { ticketType: true },
    });

    // Si gagnant, créditer automatiquement le portefeuille du joueur
    if (ticket.isWinner && ticket.prizeAmountCents > 0) {
      await tx.wallet.update({
        where: { userId: params.userId },
        data: {
          balanceCents: { increment: ticket.prizeAmountCents },
        },
      });

      await tx.notification.create({
        data: {
          userId: params.userId,
          title: "🎉 Gain remporté !",
          message: `Félicitations ! Vous avez gagné ${ticket.prizeAmountCents / 100} ${ticket.currency} sur votre ticket ${ticket.ticketType.name}.`,
          type: "SUCCESS",
        },
      });
    }

    return updated;
  }).then(async (ticket) => {
    // Si gagnant, enregistrer l'écriture comptable du paiement de lot
    if (ticket.isWinner && ticket.prizeAmountCents > 0) {
      const isJackpot = ticket.tierName.includes("JACKPOT");
      const basePrize = isJackpot ? Math.min(ticket.prizeAmountCents, ticket.priceCents * 30) : ticket.prizeAmountCents;
      const progressiveBonus = isJackpot ? Math.max(0, ticket.prizeAmountCents - basePrize) : 0;

      const entries = [
        { accountCode: ACCOUNT_CODES.PRIZE_POOL, entryType: "DEBIT" as const, amountCents: basePrize },
        ...(progressiveBonus > 0 ? [{ accountCode: ACCOUNT_CODES.RESERVE_FUND, entryType: "DEBIT" as const, amountCents: progressiveBonus }] : []),
        { accountCode: ACCOUNT_CODES.PLAYER_BALANCES, entryType: "CREDIT" as const, amountCents: ticket.prizeAmountCents },
      ];

      await recordBalancedTransaction({
        idempotencyKey: `PRIZE_PAYOUT_${ticket.id}`,
        reference: `WIN-${ticket.ticketNumber}`,
        description: `Gain crédité pour ticket gagnant ${ticket.ticketNumber}${progressiveBonus > 0 ? ' (incluant Jackpot Évolutif)' : ''}`,
        transactionType: "PRIZE_PAYOUT",
        amountCents: ticket.prizeAmountCents,
        currency: ticket.currency,
        countryCode: ticket.countryCode,
        relatedEntityId: ticket.id,
        entries,
      });
    }

    return ticket;
  });
}
