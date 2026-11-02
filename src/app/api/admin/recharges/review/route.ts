import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { approveRechargeRequest, rejectRechargeRequest } from "@/lib/wallet";
import { z } from "zod";

const reviewSchema = z.object({
  requestId: z.string().min(1),
  action: z.enum(["APPROVE", "REJECT"]),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user.role, ["SUPER_ADMIN", "COUNTRY_ADMIN", "VERIFIER"])) {
      return NextResponse.json({ error: "Accès refusé. Rôle administrateur requis." }, { status: 403 });
    }

    const body = await req.json();
    const parsed = reviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Paramètres invalides." }, { status: 400 });
    }

    const { requestId, action, notes } = parsed.data;

    let result;
    if (action === "APPROVE") {
      result = await approveRechargeRequest({
        requestId,
        adminUserId: user.id,
        notes,
      });
    } else {
      result = await rejectRechargeRequest({
        requestId,
        adminUserId: user.id,
        reason: notes || "Demande refusée par l'administrateur.",
      });
    }

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error("Erreur review recharge:", error);
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 400 });
  }
}
