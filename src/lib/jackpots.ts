import { prisma } from "./prisma";
import { recordBalancedTransaction, ACCOUNT_CODES } from "./finance";
import crypto from "crypto";

export interface ProgressiveJackpotsState {
  silver: number;    // En Gourdes (HTG)
  gold: number;      // En Gourdes (HTG)
  maximum: number;   // En Gourdes (HTG)
  silverCents: number;
  goldCents: number;
  maximumCents: number;
  lastWinners: {
    jackpotId: string;
    jackpotName: string;
    amountHTG: number;
    wonAt: string;
  }[];
}

/**
 * Récupère l'état actuel en direct des 3 Jackpots depuis la base de données réelle
 */
export async function getProgressiveJackpots(): Promise<ProgressiveJackpotsState> {
  try {
    const jackpots = await prisma.progressiveJackpot.findMany();

    const silverRecord = jackpots.find((j) => j.id === "SILVER");
    const goldRecord = jackpots.find((j) => j.id === "GOLD");
    const maxRecord = jackpots.find((j) => j.id === "MAXIMUM");

    const silverCents = silverRecord ? Number(silverRecord.currentAmountCents) : 656500;
    const goldCents = goldRecord ? Number(goldRecord.currentAmountCents) : 5923400;
    const maximumCents = maxRecord ? Number(maxRecord.currentAmountCents) : 2074400;

    return {
      silver: Math.floor(silverCents / 100),
      gold: Math.floor(goldCents / 100),
      maximum: Math.floor(maximumCents / 100),
      silverCents,
      goldCents,
      maximumCents,
      lastWinners: jackpots
        .filter((j) => j.lastWonAt && j.lastWonAmountCents)
        .map((j) => ({
          jackpotId: j.id,
          jackpotName: j.name,
          amountHTG: Math.floor((j.lastWonAmountCents || 0) / 100),
          wonAt: j.lastWonAt!.toISOString(),
        })),
    };
  } catch (err) {
    console.error("Erreur lecture jackpots:", err);
    // Valeurs de secours calquées sur la maquette officielle
    return {
      silver: 6565,
      gold: 59234,
      maximum: 20744,
      silverCents: 656500,
      goldCents: 5923400,
      maximumCents: 2074400,
      lastWinners: [],
    };
  }
}

/**
 * Alimente les jackpots progressifs à partir de chaque mise réelle
 * 0.5% Silver, 0.3% Gold, 0.2% Maximum
 */
export async function contributeToJackpots(stakeCents: number): Promise<void> {
  if (stakeCents <= 0) return;

  const silverAdd = Math.max(1, Math.round(stakeCents * 0.005));
  const goldAdd = Math.max(1, Math.round(stakeCents * 0.003));
  const maxAdd = Math.max(1, Math.round(stakeCents * 0.002));

  try {
    await prisma.$transaction([
      prisma.progressiveJackpot.update({
        where: { id: "SILVER" },
        data: { currentAmountCents: { increment: silverAdd } },
      }),
      prisma.progressiveJackpot.update({
        where: { id: "GOLD" },
        data: { currentAmountCents: { increment: goldAdd } },
      }),
      prisma.progressiveJackpot.update({
        where: { id: "MAXIMUM" },
        data: { currentAmountCents: { increment: maxAdd } },
      }),
    ]);
  } catch (err) {
    console.error("Erreur contribution jackpot:", err);
  }
}

/**
 * Vérifie si le joueur déclenche un Jackpot progressif lors d'une mise
 */
export async function checkAndAwardJackpot(
  userId: string,
  stakeCents: number
): Promise<{ won: boolean; jackpot?: { id: string; name: string; amountCents: number; amountHTG: number } }> {
  try {
    const jackpots = await prisma.progressiveJackpot.findMany();

    // Tester du plus petit au plus gros
    for (const jp of jackpots) {
      // Tirage au sort aléatoire cryptographique
      const rand = crypto.randomInt(0, 1000000);
      const threshold = Math.round(jp.probability * 1000000);

      if (rand < threshold) {
        // JACKPOT GAGNÉ !
        const wonAmountCents = Number(jp.currentAmountCents);

        await prisma.$transaction(async (tx) => {
          // 1. Créditer le compte du gagnant
          await tx.wallet.update({
            where: { userId },
            data: { balanceCents: { increment: wonAmountCents } },
          });

          // 2. Réinitialiser le jackpot à son seed
          await tx.progressiveJackpot.update({
            where: { id: jp.id },
            data: {
              currentAmountCents: jp.seedAmountCents,
              lastWonAt: new Date(),
              lastWinnerUserId: userId,
              lastWonAmountCents: wonAmountCents,
              totalPaidOutCents: { increment: wonAmountCents },
            },
          });

          // 3. Notification officielle pour le joueur
          await tx.notification.create({
            data: {
              userId,
              title: `🌟 GIGA JACKPOT ${jp.name.toUpperCase()} !`,
              message: `INCROYABLE ! Vous venez de décrocher le ${jp.name} pour un montant de ${(wonAmountCents / 100).toLocaleString()} HTG !`,
              type: "SUCCESS",
            },
          });
        });

        // 4. Grand Livre comptable
        await recordBalancedTransaction({
          idempotencyKey: `JACKPOT_PAYOUT_${jp.id}_${Date.now()}`,
          reference: `JACKPOT-${jp.id}`,
          description: `Paiement ${jp.name} remporté`,
          transactionType: "PRIZE_PAYOUT",
          amountCents: wonAmountCents,
          currency: "HTG",
          countryCode: "HT",
          entries: [
            { accountCode: ACCOUNT_CODES.PRIZE_POOL, entryType: "DEBIT", amountCents: wonAmountCents },
            { accountCode: ACCOUNT_CODES.PLAYER_BALANCES, entryType: "CREDIT", amountCents: wonAmountCents },
          ],
        });

        return {
          won: true,
          jackpot: {
            id: jp.id,
            name: jp.name,
            amountCents: wonAmountCents,
            amountHTG: Math.floor(wonAmountCents / 100),
          },
        };
      }
    }
  } catch (err) {
    console.error("Erreur vérification jackpot:", err);
  }

  return { won: false };
}
