import { describe, it, expect } from "vitest";
import { getDictionary, formatCurrency } from "../lib/i18n";

describe("Internationalisation & Localisation (i18n)", () => {
  it("charge le dictionnaire créole haïtien (ht) avec toutes les clés", () => {
    const dictHt = getDictionary("ht");
    expect(dictHt.common.appName).toBe("GRATIKO");
    expect(dictHt.common.demoBadge).toContain("MÒD DEMONSTRASYON");
    expect(dictHt.tickets.scratchNow).toBe("Grate kounye a");
    expect(dictHt.dashboard.walletTitle).toContain("Bous");
  });

  it("charge le dictionnaire français (fr)", () => {
    const dictFr = getDictionary("fr");
    expect(dictFr.common.appName).toBe("GRATIKO");
    expect(dictFr.common.demoBadge).toContain("MODE DÉMONSTRATION");
    expect(dictFr.tickets.scratchNow).toBe("Gratter maintenant");
  });

  it("formate correctement les montants monétaires en Gourdes haïtiennes", () => {
    const formatted = formatCurrency(10000, "HTG", "fr");
    expect(formatted).toContain("100");
    expect(formatted).toContain("HTG");
  });
});
