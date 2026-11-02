import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { purchaseTicket } from "@/lib/tickets";
import { z } from "zod";

const purchaseSchema = z.object({
  ticketTypeId: z.string().min(1),
  idempotencyKey: z.string().min(8),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
    }

    if (user.role !== "PLAYER") {
      return NextResponse.json({ error: "Les comptes administratifs sont strictement interdits de jeu pour garantir l'intégrité de la plateforme." }, { status: 403 });
    }

    const body = await req.json();
    const parsed = purchaseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Paramètres d'achat invalides." }, { status: 400 });
    }

    const ticket = await purchaseTicket({
      userId: user.id,
      ticketTypeId: parsed.data.ticketTypeId,
      idempotencyKey: parsed.data.idempotencyKey,
    });

    return NextResponse.json({
      success: true,
      ticket: {
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        priceCents: ticket.priceCents,
        currency: ticket.currency,
        isWinner: ticket.isWinner,
        prizeAmountCents: ticket.prizeAmountCents,
        tierName: ticket.tierName,
        symbolsPattern: ticket.symbolsPattern,
        status: ticket.status,
        ticketType: ticket.ticketType,
      },
    });
  } catch (error: any) {
    console.error("Erreur achat ticket:", error);
    return NextResponse.json({ error: error.message || "Erreur lors de l'achat." }, { status: 400 });
  }
}
