import { describe, it, expect } from "vitest";
import { calculateTicketFinancialSplit, recordBalancedTransaction } from "../lib/finance";

describe("Moteur Financier & Grand Livre GRATIKO", () => {
  it("calcule exactement la répartition 20% commission, 80% jeu, 40% réserve pour un ticket à 100 HTG", () => {
    const priceCents = 10000; // 100 HTG
    const split = calculateTicketFinancialSplit(priceCents);

    expect(split.priceCents).toBe(10000);
    // 20% commission opérateur = 20 HTG (2000 cents)
    expect(split.commissionCents).toBe(2000);
    // 80% allocation jeu = 80 HTG (8000 cents)
    expect(split.gameAllocationCents).toBe(8000);
    // 40% de l'allocation jeu en réserve = 32 HTG (3200 cents)
    expect(split.reserveCents).toBe(3200);
    // Reste pour la cagnotte = 48 HTG (4800 cents)
    expect(split.prizeBudgetCents).toBe(4800);

    // Vérification de la conservation stricte des fonds
    expect(split.commissionCents + split.reserveCents + split.prizeBudgetCents).toBe(priceCents);
  });

  it("calcule la répartition pour un ticket à 200 HTG", () => {
    const priceCents = 20000; // 200 HTG
    const split = calculateTicketFinancialSplit(priceCents);

    expect(split.commissionCents).toBe(4000); // 40 HTG
    expect(split.gameAllocationCents).toBe(16000); // 160 HTG
    expect(split.reserveCents).toBe(6400); // 64 HTG
    expect(split.prizeBudgetCents).toBe(9600); // 96 HTG
    expect(split.commissionCents + split.reserveCents + split.prizeBudgetCents).toBe(priceCents);
  });

  it("rejette tout déséquilibre Débit != Crédit dans le grand livre", async () => {
    await expect(
      recordBalancedTransaction({
        idempotencyKey: "test_unbalanced_key",
        reference: "UNBALANCED-001",
        description: "Transaction test déséquilibrée",
        transactionType: "TEST",
        amountCents: 10000,
        entries: [
          { accountCode: "1010-CASH-VAULT", entryType: "DEBIT", amountCents: 10000 },
          { accountCode: "2010-PLAYER-BALANCES", entryType: "CREDIT", amountCents: 8000 }, // 2000 de déséquilibre
        ],
      })
    ).rejects.toThrow("Déséquilibre comptable interdit");
  });
});
