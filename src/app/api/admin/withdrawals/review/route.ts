import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { markWithdrawalAsPaid } from "@/lib/wallet";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const reviewSchema = z.object({
  withdrawalId: z.string().min(1),
  action: z.enum(["MARK_PAID", "REJECT"]),
  payoutReference: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user.role, ["SUPER_ADMIN", "COUNTRY_ADMIN"])) {
      return NextResponse.json({ error: "Accès refusé. Rôle administrateur requis." }, { status: 403 });
    }

    const body = await req.json();
    const parsed = reviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Paramètres invalides." }, { status: 400 });
    }

    const { withdrawalId, action, payoutReference, notes } = parsed.data;

    if (action === "MARK_PAID") {
      if (!payoutReference) {
        return NextResponse.json({ error: "Une référence de paiement réelle est obligatoire." }, { status: 400 });
      }

      const result = await markWithdrawalAsPaid({
        withdrawalId,
        adminUserId: user.id,
        payoutReference,
        notes,
      });

      return NextResponse.json({ success: true, result });
    } else {
      // Rejet de retrait: rembourser le portefeuille (décrémenter pendingOutCents et incrémenter balanceCents)
      const withdrawal = await prisma.withdrawalRequest.findUnique({
        where: { id: withdrawalId },
      });

      if (!withdrawal || withdrawal.status !== "REQUESTED") {
        return NextResponse.json({ error: "Demande de retrait invalide." }, { status: 400 });
      }

      await prisma.$transaction([
        prisma.withdrawalRequest.update({
          where: { id: withdrawalId },
          data: {
            status: "REJECTED",
            adminNotes: notes || "Retrait refusé par l'administration",
            reviewedByUserId: user.id,
            reviewedAt: new Date(),
          },
        }),
        prisma.wallet.update({
          where: { userId: withdrawal.userId },
          data: {
            balanceCents: { increment: withdrawal.amountCents },
            pendingOutCents: { decrement: withdrawal.amountCents },
          },
        }),
        prisma.notification.create({
          data: {
            userId: withdrawal.userId,
            title: "Demande de retrait refusée",
            message: `Votre demande de retrait de ${withdrawal.amountCents / 100} ${withdrawal.currency} a été rejetée. Les fonds sont retournés sur votre solde disponible. Motif: ${notes || "Non spécifié"}`,
            type: "WARNING",
          },
        }),
      ]);

      return NextResponse.json({ success: true, message: "Retrait rejeté et fonds retournés au joueur." });
    }
  } catch (error: any) {
    console.error("Erreur review retrait:", error);
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 400 });
  }
}
