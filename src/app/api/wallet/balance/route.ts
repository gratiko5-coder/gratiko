import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const wallet = await prisma.wallet.findUnique({
      where: { userId: user.id },
      select: {
        balanceCents: true,
        pendingInCents: true,
        pendingOutCents: true,
        currency: true,
      },
    });

    return NextResponse.json({
      success: true,
      balanceCents: wallet?.balanceCents || 0,
      currency: wallet?.currency || user.currency || "HTG",
      pendingInCents: wallet?.pendingInCents || 0,
      pendingOutCents: wallet?.pendingOutCents || 0,
    });
  } catch (error: any) {
    console.error("Erreur récupération solde:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
