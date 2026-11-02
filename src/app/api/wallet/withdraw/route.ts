import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createWithdrawalRequest } from "@/lib/wallet";
import { z } from "zod";

const withdrawSchema = z.object({
  amountCents: z.number().int().min(20000), // Min 200 HTG
  payoutMethod: z.string().min(1),
  destinationAccount: z.string().min(4),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
    }

    const body = await req.json();
    const parsed = withdrawSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Montant ou informations de retrait invalides (Min 200 HTG)." }, { status: 400 });
    }

    const withdrawal = await createWithdrawalRequest({
      userId: user.id,
      amountCents: parsed.data.amountCents,
      payoutMethod: parsed.data.payoutMethod,
      destinationAccount: parsed.data.destinationAccount,
      currency: user.currency,
      countryCode: user.countryCode,
    });

    return NextResponse.json({ success: true, withdrawal });
  } catch (error: any) {
    console.error("Erreur retrait:", error);
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 400 });
  }
}
