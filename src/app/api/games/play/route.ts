import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordBalancedTransaction, ACCOUNT_CODES, calculateTicketFinancialSplit } from "@/lib/finance";
import { contributeToJackpots, checkAndAwardJackpot } from "@/lib/jackpots";
import crypto from "crypto";

export const dynamic = "force-dynamic";

function getRandomInt(min: number, max: number): number {
  return crypto.randomInt(min, max + 1);
}

// Couleurs officielles pour les 48 boules de Lucky 6
const LUCKY6_COLORS = ["#ef4444", "#10b981", "#3b82f6", "#a855f7", "#b45309", "#eab308"];

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
    }

    if (user.role !== "PLAYER") {
      return NextResponse.json({ error: "Comptes administratifs interdits de jeu." }, { status: 403 });
    }

    const body = await req.json();
    const { gameType, betCents, choice } = body;

    if (!gameType || typeof betCents !== "number" || betCents <= 0) {
      return NextResponse.json({ error: "Paramètres de jeu invalides." }, { status: 400 });
    }

    // Mises autorisées : min 10 HTG (1000 cents), max 5000 HTG (500 000 cents)
    if (betCents < 1000 || betCents > 500000) {
      return NextResponse.json(
        { error: "Mise non autorisée (min 10 HTG, max 5 000 HTG)." },
        { status: 400 }
      );
    }

    const currency = user.currency || "HTG";
    const countryCode = user.countryCode || "HT";

    // Exécution transactionnelle atomique
    const gameResult = await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: { userId: user.id },
      });

      if (!wallet || wallet.balanceCents < betCents) {
        throw new Error("Ou pa gen ase lajan nan bous ou pou jwe.");
      }

      // Débiter la mise
      await tx.wallet.update({
        where: { userId: user.id },
        data: {
          balanceCents: { decrement: betCents },
        },
      });

      let won = false;
      let multiplier = 0;
      let prizeCents = 0;
      let outcomeData: any = {};

      if (gameType === "KENO") {
        // KENO 80 : 20 boules tirées parmi 80
        const userNumbers = Array.isArray(choice)
          ? choice.map(Number).filter((n) => n >= 1 && n <= 80).slice(0, 10)
          : [1, 2, 3, 4, 5];

        if (userNumbers.length === 0) {
          throw new Error("Veuillez sélectionner au moins un numéro (entre 1 et 10 numéros).");
        }

        // Tirage aléatoire sécurisé de 20 boules distinctes
        const drawnSet = new Set<number>();
        while (drawnSet.size < 20) {
          drawnSet.add(crypto.randomInt(1, 81));
        }
        const drawnNumbers = Array.from(drawnSet);

        // Correspondances
        const matchedNumbers = userNumbers.filter((n) => drawnSet.has(n));
        const hits = matchedNumbers.length;
        const picks = userNumbers.length;

        // Table des gains Keno standard
        if (picks === 1) {
          if (hits === 1) multiplier = 3.5;
        } else if (picks === 2) {
          if (hits === 2) multiplier = 9;
        } else if (picks === 3) {
          if (hits === 2) multiplier = 2;
          else if (hits === 3) multiplier = 25;
        } else if (picks === 4) {
          if (hits === 2) multiplier = 1.5;
          else if (hits === 3) multiplier = 5;
          else if (hits === 4) multiplier = 80;
        } else if (picks === 5) {
          if (hits === 3) multiplier = 3;
          else if (hits === 4) multiplier = 15;
          else if (hits === 5) multiplier = 300;
        } else if (picks === 6) {
          if (hits === 3) multiplier = 2;
          else if (hits === 4) multiplier = 7;
          else if (hits === 5) multiplier = 50;
          else if (hits === 6) multiplier = 1000;
        } else if (picks >= 7) {
          if (hits === 4) multiplier = 4;
          else if (hits === 5) multiplier = 20;
          else if (hits === 6) multiplier = 100;
          else if (hits >= 7) multiplier = 2500;
        }

        won = multiplier > 0;
        prizeCents = Math.round(betCents * multiplier);
        outcomeData = { userNumbers, drawnNumbers, matchedNumbers, hits, picks };

      } else if (gameType === "LUCKY6") {
        // LUCKY 6 : 35 boules tirées parmi 48 (6 numéros choisis par le joueur)
        const userNumbers = Array.isArray(choice)
          ? choice.map(Number).filter((n) => n >= 1 && n <= 48).slice(0, 6)
          : [1, 2, 3, 4, 5, 6];

        if (userNumbers.length !== 6) {
          throw new Error("Lucky 6 nécessite la sélection d'exactement 6 numéros.");
        }

        // Création du sac de 48 boules avec couleurs
        const deck: { number: number; color: string }[] = [];
        for (let i = 1; i <= 48; i++) {
          deck.push({
            number: i,
            color: LUCKY6_COLORS[(i - 1) % LUCKY6_COLORS.length],
          });
        }

        // Mélange de Fisher-Yates cryptographique
        for (let i = deck.length - 1; i > 0; i--) {
          const j = crypto.randomInt(0, i + 1);
          [deck[i], deck[j]] = [deck[j], deck[i]];
        }

        // Tirage des 35 boules ordonnées
        const drawnBalls = deck.slice(0, 35);

        // Vérifier à quelle boule le joueur a complété ses 6 numéros
        let foundCount = 0;
        let completionBallIndex = -1;

        for (let idx = 0; idx < drawnBalls.length; idx++) {
          if (userNumbers.includes(drawnBalls[idx].number)) {
            foundCount++;
            if (foundCount === 6) {
              completionBallIndex = idx + 1; // 1-indexé (entre 6 et 35)
              break;
            }
          }
        }

        // Table des multiplicateurs Lucky 6 selon la position de la 6e boule
        if (completionBallIndex === 6) multiplier = 10000;
        else if (completionBallIndex === 7) multiplier = 7500;
        else if (completionBallIndex === 8) multiplier = 5000;
        else if (completionBallIndex === 9) multiplier = 3000;
        else if (completionBallIndex === 10) multiplier = 2000;
        else if (completionBallIndex <= 15 && completionBallIndex > 10) multiplier = 500;
        else if (completionBallIndex <= 20 && completionBallIndex > 15) multiplier = 100;
        else if (completionBallIndex <= 25 && completionBallIndex > 20) multiplier = 30;
        else if (completionBallIndex <= 30 && completionBallIndex > 25) multiplier = 8;
        else if (completionBallIndex <= 35 && completionBallIndex > 30) multiplier = 2;
        else multiplier = 0;

        won = multiplier > 0;
        prizeCents = Math.round(betCents * multiplier);
        outcomeData = {
          userNumbers,
          drawnBalls,
          foundCount,
          completionBallIndex,
        };

      } else if (gameType === "WHEEL") {
        const rand = crypto.randomInt(0, 1000);
        let segmentIndex = 0;
        if (rand < 680) {
          segmentIndex = 0;
          multiplier = 0;
        } else if (rand < 830) {
          segmentIndex = 1;
          multiplier = 1;
        } else if (rand < 910) {
          segmentIndex = 2;
          multiplier = 1.5;
        } else if (rand < 960) {
          segmentIndex = 3;
          multiplier = 2;
        } else if (rand < 985) {
          segmentIndex = 4;
          multiplier = 3;
        } else if (rand < 995) {
          segmentIndex = 5;
          multiplier = 5;
        } else {
          segmentIndex = 6;
          multiplier = 10;
        }

        won = multiplier > 0;
        prizeCents = Math.round(betCents * multiplier);
        outcomeData = { segmentIndex, multiplier };

      } else if (gameType === "COINFLIP") {
        const selectedSide = choice === "HEADS" ? "HEADS" : "TAILS";
        const roll = crypto.randomInt(0, 100);
        const isWin = roll < 45;
        const resultSide = isWin ? selectedSide : selectedSide === "HEADS" ? "TAILS" : "HEADS";

        won = isWin;
        multiplier = isWin ? 2 : 0;
        prizeCents = isWin ? betCents * 2 : 0;
        outcomeData = { resultSide, selectedSide };

      } else if (gameType === "LOTO") {
        const userNumbers = Array.isArray(choice) ? choice.slice(0, 3).map(Number) : [1, 2, 3];
        const drawnSet = new Set<number>();
        while (drawnSet.size < 3) {
          drawnSet.add(crypto.randomInt(1, 31));
        }
        const drawnNumbers = Array.from(drawnSet);

        const matches = userNumbers.filter((n) => drawnNumbers.includes(n)).length;

        if (matches === 1) multiplier = 1.5;
        else if (matches === 2) multiplier = 8;
        else if (matches === 3) multiplier = 50;
        else multiplier = 0;

        won = multiplier > 0;
        prizeCents = Math.round(betCents * multiplier);
        outcomeData = { userNumbers, drawnNumbers, matches };

      } else {
        throw new Error("Type de jeu instantané inconnu.");
      }

      // Si gagnant, créditer immédiatement le portefeuille
      let finalWalletBalance = wallet.balanceCents - betCents;
      if (won && prizeCents > 0) {
        const credited = await tx.wallet.update({
          where: { userId: user.id },
          data: { balanceCents: { increment: prizeCents } },
        });
        finalWalletBalance = credited.balanceCents;

        await tx.notification.create({
          data: {
            userId: user.id,
            title: `🎉 Gain ${gameType} !`,
            message: `Bravo ! Vous avez remporté ${(prizeCents / 100).toFixed(2)} ${currency} sur ${gameType}.`,
            type: "SUCCESS",
          },
        });
      }

      return {
        gameType,
        betCents,
        won,
        multiplier,
        prizeCents,
        outcomeData,
        newBalanceCents: finalWalletBalance,
      };
    });

    // Enregistrement au Grand Livre comptable en partie double
    const txId = `INSTANT_${gameResult.gameType}_${Date.now()}_${getRandomInt(1000, 9999)}`;
    const split = calculateTicketFinancialSplit(betCents);

    await recordBalancedTransaction({
      idempotencyKey: `GAME_BET_${txId}`,
      reference: txId,
      description: `Mise Jeu Instantané ${gameResult.gameType}`,
      transactionType: "TICKET_PURCHASE",
      amountCents: betCents,
      currency,
      countryCode,
      entries: [
        { accountCode: ACCOUNT_CODES.PLAYER_BALANCES, entryType: "DEBIT", amountCents: betCents },
        { accountCode: ACCOUNT_CODES.GROSS_SALES, entryType: "CREDIT", amountCents: betCents },
      ],
    });

    await recordBalancedTransaction({
      idempotencyKey: `GAME_ALLOC_${txId}`,
      reference: `ALLOC-${txId}`,
      description: `Ventilation 20% Comm / 32% Réserve / 48% Caisse Jeu`,
      transactionType: "COMMISSION_ALLOCATION",
      amountCents: betCents,
      currency,
      countryCode,
      entries: [
        { accountCode: ACCOUNT_CODES.GROSS_SALES, entryType: "DEBIT", amountCents: betCents },
        { accountCode: ACCOUNT_CODES.OPERATOR_COMMISSION, entryType: "CREDIT", amountCents: split.commissionCents },
        { accountCode: ACCOUNT_CODES.RESERVE_FUND, entryType: "CREDIT", amountCents: split.reserveCents },
        { accountCode: ACCOUNT_CODES.PRIZE_POOL, entryType: "CREDIT", amountCents: split.prizeBudgetCents },
      ],
    });

    if (gameResult.won && gameResult.prizeCents > 0) {
      await recordBalancedTransaction({
        idempotencyKey: `GAME_WIN_${txId}`,
        reference: `WIN-${txId}`,
        description: `Gain remporté sur ${gameResult.gameType} (${gameResult.multiplier}x)`,
        transactionType: "PRIZE_PAYOUT",
        amountCents: gameResult.prizeCents,
        currency,
        countryCode,
        entries: [
          { accountCode: ACCOUNT_CODES.PRIZE_POOL, entryType: "DEBIT", amountCents: gameResult.prizeCents },
          { accountCode: ACCOUNT_CODES.PLAYER_BALANCES, entryType: "CREDIT", amountCents: gameResult.prizeCents },
        ],
      });
    }

    // Alimentation et vérification des 3 Jackpots Progressifs Réels
    await contributeToJackpots(betCents);
    const jackpotCheck = await checkAndAwardJackpot(user.id, betCents);

    return NextResponse.json({
      success: true,
      result: gameResult,
      jackpotWon: jackpotCheck.won ? jackpotCheck.jackpot : null,
    });
  } catch (error: any) {
    console.error("Erreur jeu instantané:", error);
    return NextResponse.json({ error: error.message || "Erreur lors du tirage." }, { status: 400 });
  }
}
