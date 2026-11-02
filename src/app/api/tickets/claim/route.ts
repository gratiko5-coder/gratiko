import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { revealAndClaimTicket } from "@/lib/tickets";
import { z } from "zod";

const claimSchema = z.object({
  ticketId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
    }

    const body = await req.json();
    const parsed = claimSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Identifiant du ticket requis." }, { status: 400 });
    }

    const ticket = await revealAndClaimTicket({
      ticketId: parsed.data.ticketId,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      ticket,
      newBalanceCents: (ticket as any).remainingBalanceCents,
    });
  } catch (error: any) {
    console.error("Erreur réclamation ticket:", error);
    return NextResponse.json({ error: error.message || "Erreur lors de la réclamation." }, { status: 400 });
  }
}
