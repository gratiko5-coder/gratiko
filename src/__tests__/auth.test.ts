import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword, createSessionToken, verifySessionToken, hasPermission } from "../lib/auth";

describe("Module Authentification & Sécurité", () => {
  it("hache le mot de passe de manière non réversible et vérifie les empreintes", async () => {
    const rawPass = "SuperSecretGratiko2026!";
    const hash = await hashPassword(rawPass);

    expect(hash).not.toBe(rawPass);
    expect(hash.startsWith("$2")).toBe(true);

    const isMatch = await verifyPassword(rawPass, hash);
    expect(isMatch).toBe(true);

    const isBadMatch = await verifyPassword("WrongPassword123", hash);
    expect(isBadMatch).toBe(false);
  });

  it("génère et vérifie un jeton JWT de session signé", async () => {
    const payload = {
      userId: "user_test_123",
      email: "joueur.test@gratiko.demo",
      role: "PLAYER",
      countryCode: "HT",
      preferredLocale: "ht",
      isDemoAccount: true,
    };

    const token = await createSessionToken(payload);
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(30);

    const decoded = await verifySessionToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.userId).toBe(payload.userId);
    expect(decoded?.email).toBe(payload.email);
    expect(decoded?.role).toBe("PLAYER");
  });

  it("contrôle strictement les permissions RBAC côté serveur", () => {
    expect(hasPermission("SUPER_ADMIN", ["PLAYER"])).toBe(true); // Super Admin bypass
    expect(hasPermission("COUNTRY_ADMIN", ["SUPER_ADMIN", "COUNTRY_ADMIN"])).toBe(true);
    expect(hasPermission("PLAYER", ["SUPER_ADMIN", "COUNTRY_ADMIN"])).toBe(false);
    expect(hasPermission("VERIFIER", ["SUPER_ADMIN", "VERIFIER"])).toBe(true);
  });
});
