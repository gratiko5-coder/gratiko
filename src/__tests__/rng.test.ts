import { describe, it, expect } from "vitest";
import { getRandomInt, generateSymbolsForOutcome, validatePrizeTiers } from "../lib/rng";

describe("Moteur RNG & Distribution des Lots", () => {
  it("génère des entiers dans la borne spécifiée avec crypto RNG", () => {
    for (let i = 0; i < 50; i++) {
      const val = getRandomInt(0, 10);
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(10);
    }
  });

  it("génère une grille gagnante contenant au moins 3 symboles identiques", () => {
    const symbols = generateSymbolsForOutcome(true, 50000);
    expect(symbols.length).toBe(9);

    const counts: Record<string, number> = {};
    for (const s of symbols) {
      counts[s] = (counts[s] || 0) + 1;
    }

    const hasAtLeastThreeMatching = Object.values(counts).some((c) => c >= 3);
    expect(hasAtLeastThreeMatching).toBe(true);
  });

  it("génère une grille perdante ne contenant jamais 3 symboles identiques", () => {
    for (let run = 0; run < 20; run++) {
      const symbols = generateSymbolsForOutcome(false, 0);
      expect(symbols.length).toBe(9);

      const counts: Record<string, number> = {};
      for (const s of symbols) {
        counts[s] = (counts[s] || 0) + 1;
      }

      const hasThreeMatching = Object.values(counts).some((c) => c >= 3);
      expect(hasThreeMatching).toBe(false);
    }
  });

  it("valide et rejette les configurations de probabilités dont la somme est différente de 100%", () => {
    const validTiers = [
      { tierName: "PERDANT", probability: 0.70, prizeAmountCents: 0 },
      { tierName: "GAIN_100", probability: 0.20, prizeAmountCents: 10000 },
      { tierName: "GAIN_500", probability: 0.10, prizeAmountCents: 50000 },
    ];
    expect(validatePrizeTiers(validTiers).isValid).toBe(true);

    const invalidTiers = [
      { tierName: "PERDANT", probability: 0.70, prizeAmountCents: 0 },
      { tierName: "GAIN_100", probability: 0.20, prizeAmountCents: 10000 },
      // Somme = 90% (manque 10%)
    ];
    const res = validatePrizeTiers(invalidTiers);
    expect(res.isValid).toBe(false);
    expect(res.error).toContain("somme des probabilités");
  });
});
