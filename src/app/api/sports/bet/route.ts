import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { placeSportBet } from "@/lib/sports";
import { z } from "zod";

export const dynamic = "force-dynamic";

const selectionSchema = z.object({
  matchId: z.string().min(1),
  selectedOutcome: z.enum(["HOME", "DRAW", "AWAY"]),
});

const betRequestSchema = z.object({
  stakeCents: z.number().int().min(1000), // Min 10 HTG
  selections: z.array(selectionSchema).min(1).optional(),
  // Support rétro-compatible si match unique
  matchId: z.string().optional(),
  selectedOutcome: z.enum(["HOME", "DRAW", "AWAY"]).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentification requise pour parier." }, { status: 401 });
    }

    if (user.role !== "PLAYER") {
      return NextResponse.json({ error: "Les comptes administratifs sont interdits de pari." }, { status: 403 });
    }

    const body = await req.json();
    const parsed = betRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données de pari invalides (Mise minimale: 10 HTG)." },
        { status: 400 }
      );
    }

    let selections = parsed.data.selections;
    if (!selections || selections.length === 0) {
      if (parsed.data.matchId && parsed.data.selectedOutcome) {
        selections = [
          {
            matchId: parsed.data.matchId,
            selectedOutcome: parsed.data.selectedOutcome,
          },
        ];
      } else {
        return NextResponse.json(
          { error: "Veuillez sélectionner au moins un pari." },
          { status: 400 }
        );
      }
    }

    const result = await placeSportBet({
      userId: user.id,
      stakeCents: parsed.data.stakeCents,
      selections,
    });

    return NextResponse.json({
      success: true,
      bet: result.bet,
      newBalanceCents: result.newBalanceCents,
    });
  } catch (error: any) {
    console.error("Erreur placement pari:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la validation du coupon." },
      { status: 400 }
    );
  }
}
