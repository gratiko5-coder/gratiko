import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "../lib/prisma";
import { runDatabaseSeed } from "../lib/seed";
import { purchaseTicket, revealAndClaimTicket } from "../lib/tickets";
import { createRechargeRequest, approveRechargeRequest, createWithdrawalRequest, markWithdrawalAsPaid } from "../lib/wallet";
import { getFinancialSummary } from "../lib/finance";

describe("Parcours Complet E2E Gratiko", () => {
  let testUser: any;
  let standardTicketType: any;

  beforeAll(async () => {
    await runDatabaseSeed();
    testUser = await prisma.user.findUnique({
      where: { email: "joueur@gratiko.demo" },
      include: { wallet: true },
    });
    standardTicketType = await prisma.ticketType.findUnique({
      where: { slug: "chans-lakay-100" },
    });
  });

  it("1. Vérifie le solde initial du joueur démo et l'accès au marché", async () => {
    expect(testUser).not.toBeNull();
    expect(testUser.wallet.balanceCents).toBeGreaterThanOrEqual(10000); // Au moins 100 HTG
  });

  it("2. Achète un ticket et scelle le résultat de manière immuable sur le serveur", async () => {
    const initialBalance = (await prisma.wallet.findUnique({ where: { userId: testUser.id } }))!.balanceCents;
    const idempotencyKey = `E2E_BUY_${Date.now()}_${Math.random()}`;

    const ticket = await purchaseTicket({
      userId: testUser.id,
      ticketTypeId: standardTicketType.id,
      idempotencyKey,
    });

    expect(ticket.status).toBe("PURCHASED");
    expect(ticket.priceCents).toBe(10000);
    expect(ticket.tierName).toBeDefined();
    expect(ticket.symbolsPattern).toBeDefined();

    const afterBalance = (await prisma.wallet.findUnique({ where: { userId: testUser.id } }))!.balanceCents;
    expect(afterBalance).toBe(initialBalance - 10000);

    // 3. Test de protection contre double clic avec la même clé d'idempotence
    const duplicateBuy = await purchaseTicket({
      userId: testUser.id,
      ticketTypeId: standardTicketType.id,
      idempotencyKey,
    });
    expect(duplicateBuy.id).toBe(ticket.id);
    const afterDuplicateBalance = (await prisma.wallet.findUnique({ where: { userId: testUser.id } }))!.balanceCents;
    expect(afterDuplicateBalance).toBe(afterBalance); // Aucun prélèvement supplémentaire !

    // 4. Révélation et Réclamation du ticket
    const claimedTicket = await revealAndClaimTicket({
      ticketId: ticket.id,
      userId: testUser.id,
    });
    expect(claimedTicket.status).toBe("CLAIMED");

    if (claimedTicket.isWinner) {
      const balanceAfterWin = (await prisma.wallet.findUnique({ where: { userId: testUser.id } }))!.balanceCents;
      expect(balanceAfterWin).toBe(afterBalance + claimedTicket.prizeAmountCents);
    }
  });

  it("5. Teste le cycle de recharge manuelle et validation administrative", async () => {
    const admin = await prisma.user.findUnique({ where: { email: "superadmin@gratiko.demo" } });
    const initialBal = (await prisma.wallet.findUnique({ where: { userId: testUser.id } }))!.balanceCents;

    // Création de la demande
    const recharge = await createRechargeRequest({
      userId: testUser.id,
      amountCents: 50000, // 500 HTG
      paymentMethod: "MONCASH",
      senderIdentifier: "+509 37 12 34 56",
      transactionProof: "SMS_CONFIRM_987654",
    });

    expect(recharge.status).toBe("PENDING");

    // Approbation par l'administrateur
    const approved = await approveRechargeRequest({
      requestId: recharge.id,
      adminUserId: admin!.id,
      notes: "Vérifié sur compte MonCash officiel",
    });

    expect(approved.status).toBe("APPROVED");

    const finalBal = (await prisma.wallet.findUnique({ where: { userId: testUser.id } }))!.balanceCents;
    expect(finalBal).toBe(initialBal + 50000);
  });

  it("6. Teste le cycle de retrait avec verrouillage et exécution du paiement", async () => {
    const admin = await prisma.user.findUnique({ where: { email: "superadmin@gratiko.demo" } });
    const initialWallet = (await prisma.wallet.findUnique({ where: { userId: testUser.id } }))!;

    // Demande de retrait de 200 HTG (20000 cents)
    const withdrawal = await createWithdrawalRequest({
      userId: testUser.id,
      amountCents: 20000,
      payoutMethod: "MONCASH",
      destinationAccount: "+509 37 99 88 77",
    });

    expect(withdrawal.status).toBe("REQUESTED");

    // Le solde disponible doit être décrémenté et pendingOut incrémenté
    const lockedWallet = (await prisma.wallet.findUnique({ where: { userId: testUser.id } }))!;
    expect(lockedWallet.balanceCents).toBe(initialWallet.balanceCents - 20000);
    expect(lockedWallet.pendingOutCents).toBe(initialWallet.pendingOutCents + 20000);

    // L'administrateur valide le paiement effectif
    const paid = await markWithdrawalAsPaid({
      withdrawalId: withdrawal.id,
      adminUserId: admin!.id,
      payoutReference: "MC-TRANS-55443322",
      notes: "Virement MonCash exécuté",
    });

    expect(paid.status).toBe("PAID");

    const finalWallet = (await prisma.wallet.findUnique({ where: { userId: testUser.id } }))!;
    expect(finalWallet.pendingOutCents).toBe(initialWallet.pendingOutCents);
  });

  it("7. Vérifie l'équilibre comptable et la solvabilité financière", async () => {
    const summary = await getFinancialSummary("HT", "HTG");
    expect(summary.isSolvent).toBe(true);
    expect(summary.grossSalesCents).toBeGreaterThan(0);
    expect(summary.operatorCommissionCents).toBeGreaterThan(0);
    expect(summary.reserveCents).toBeGreaterThan(0);
  });
});
