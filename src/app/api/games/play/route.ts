import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordBalancedTransaction, ACCOUNT_CODES, calculateTicketFinancialSplit } from "@/lib/finance";
import crypto from "crypto";

export const dynamic = "force-dynamic";

function getRandomInt(min: number, max: number): number {
  return crypto.randomInt(min, max + 1);
}

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

    // Mises autorisées : 50 HTG, 100 HTG, 200 HTG, 500 HTG, 1000 HTG
    if (betCents < 5000 || betCents > 100000) {
      return NextResponse.json({ error: "Mise non autorisée (min 50 HTG, max 1 000 HTG)." }, { status: 400 });
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

      if (gameType === "WHEEL") {
        // Segments de la roue :
        // 0: 0x (Perdu)
        // 1: 1x (Remboursé)
        // 2: 1.5x
        // 3: 2x
        // 4: 3x
        // 5: 5x
        // 6: 10x (Super Jackpot)
        const rand = crypto.randomInt(0, 1000);
        let segmentIndex = 0;
        if (rand < 680) {
          // 68% -> 0x
          segmentIndex = 0;
          multiplier = 0;
        } else if (rand < 830) {
          // 15% -> 1x
          segmentIndex = 1;
          multiplier = 1;
        } else if (rand < 910) {
          // 8% -> 1.5x
          segmentIndex = 2;
          multiplier = 1.5;
        } else if (rand < 960) {
          // 5% -> 2x
          segmentIndex = 3;
          multiplier = 2;
        } else if (rand < 985) {
          // 2.5% -> 3x
          segmentIndex = 4;
          multiplier = 3;
        } else if (rand < 995) {
          // 1% -> 5x
          segmentIndex = 5;
          multiplier = 5;
        } else {
          // 0.5% -> 10x
          segmentIndex = 6;
          multiplier = 10;
        }

        won = multiplier > 0;
        prizeCents = Math.round(betCents * multiplier);
        outcomeData = { segmentIndex, multiplier };

      } else if (gameType === "COINFLIP") {
        // Pile (Kwa) ou Face (Tèt)
        const selectedSide = choice === "HEADS" ? "HEADS" : "TAILS";
        const roll = crypto.randomInt(0, 100);
        // 45% de chances de gain net avec multiplicateur x2
        const isWin = roll < 45;
        const resultSide = isWin ? selectedSide : (selectedSide === "HEADS" ? "TAILS" : "HEADS");

        won = isWin;
        multiplier = isWin ? 2 : 0;
        prizeCents = isWin ? betCents * 2 : 0;
        outcomeData = { resultSide, selectedSide };

      } else if (gameType === "LOTO") {
        // Loto Minute : Tirage de 3 boules entre 1 et 30
        const userNumbers = Array.isArray(choice) ? choice.slice(0, 3).map(Number) : [1, 2, 3];
        const drawnSet = new Set<number>();
        while (drawnSet.size < 3) {
          drawnSet.add(crypto.randomInt(1, 31));
        }
        const drawnNumbers = Array.from(drawnSet);

        // Compter les correspondances
        const matches = userNumbers.filter((n) => drawnNumbers.includes(n)).length;

        if (matches === 1) {
          multiplier = 1.5;
        } else if (matches === 2) {
          multiplier = 8;
        } else if (matches === 3) {
          multiplier = 50;
        } else {
          multiplier = 0;
        }

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
            title: "🎉 Gain jeu instantané !",
            message: `Bravo ! Vous avez remporté ${prizeCents / 100} ${currency} sur le jeu ${gameType}.`,
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

    // Enregistrement au Grand Livre comptable en arrière-plan
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
      description: `Ventilation financière 20% Comm / 32% Réserve / 48% Jeu`,
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
        idempotencyKey: `GAME_PRIZE_${txId}`,
        reference: `PRIZE-${txId}`,
        description: `Paiement gain Jeu Instantané ${gameResult.gameType}`,
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

    return NextResponse.json({
      success: true,
      ...gameResult,
    });
  } catch (error: any) {
    console.error("Erreur jeu instantané:", error);
    return NextResponse.json({ error: error.message || "Erreur de jeu." }, { status: 400 });
  }
}
