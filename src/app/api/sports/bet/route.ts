import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { placeSportBet } from "@/lib/sports";
import { z } from "zod";

export const dynamic = "force-dynamic";

const betSchema = z.object({
  matchId: z.string().min(1),
  selectedOutcome: z.enum(["HOME", "DRAW", "AWAY"]),
  stakeCents: z.number().int().min(5000), // Min 50 HTG
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
    const parsed = betSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Données de pari invalides (Mise minimale: 50 HTG)." }, { status: 400 });
    }

    const result = await placeSportBet({
      userId: user.id,
      matchId: parsed.data.matchId,
      selectedOutcome: parsed.data.selectedOutcome,
      stakeCents: parsed.data.stakeCents,
    });

    return NextResponse.json({
      success: true,
      bet: result.bet,
      newBalanceCents: result.newBalanceCents,
    });
  } catch (error: any) {
    console.error("Erreur placement pari:", error);
    return NextResponse.json({ error: error.message || "Erreur de placement de pari." }, { status: 400 });
  }
}
