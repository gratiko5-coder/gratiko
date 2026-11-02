import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createRechargeRequest } from "@/lib/wallet";
import { z } from "zod";

const rechargeSchema = z.object({
  amountCents: z.number().int().min(10000), // Min 100 HTG
  paymentMethod: z.string().min(1),
  senderIdentifier: z.string().min(4),
  transactionProof: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
    }

    if (user.role !== "PLAYER") {
      return NextResponse.json({ error: "Les administrateurs ne possèdent pas de portefeuille joueur et ne peuvent pas déposer de fonds personnels." }, { status: 403 });
    }

    const body = await req.json();
    const parsed = rechargeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Données de recharge invalides (Min 100 HTG)." }, { status: 400 });
    }

    const request = await createRechargeRequest({
      userId: user.id,
      amountCents: parsed.data.amountCents,
      paymentMethod: parsed.data.paymentMethod,
      senderIdentifier: parsed.data.senderIdentifier,
      transactionProof: parsed.data.transactionProof,
      currency: user.currency,
      countryCode: user.countryCode,
    });

    return NextResponse.json({ success: true, request });
  } catch (error: any) {
    console.error("Erreur recharge:", error);
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 400 });
  }
}
