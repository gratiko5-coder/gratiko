import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validatePrizeTiers } from "@/lib/rng";
import { z } from "zod";

const tierSchema = z.object({
  tierName: z.string(),
  prizeAmountCents: z.number().int().min(0),
  probability: z.number().positive(),
  count: z.number().int().positive(),
  label: z.string(),
});

const batchCreateSchema = z.object({
  ticketTypeId: z.string(),
  totalTickets: z.number().int().positive(),
  tiers: z.array(tierSchema),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user.role, ["SUPER_ADMIN"])) {
      return NextResponse.json({ error: "Action réservée au Super-Administrateur." }, { status: 403 });
    }

    const body = await req.json();
    const parsed = batchCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Paramètres de lot invalides.", details: parsed.error.format() }, { status: 400 });
    }

    const { ticketTypeId, totalTickets, tiers } = parsed.data;

    // Validation des probabilités
    const validation = validatePrizeTiers(tiers);
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const ticketType = await prisma.ticketType.findUnique({ where: { id: ticketTypeId } });
    if (!ticketType) {
      return NextResponse.json({ error: "Type de ticket introuvable." }, { status: 404 });
    }

    const totalCostCents = totalTickets * ticketType.priceCents;
    const maxPrizeBudgetCents = tiers.reduce((sum, t) => sum + t.prizeAmountCents * t.count, 0);

    const batchNumber = `BATCH-${ticketType.slug.toUpperCase()}-${Date.now().toString().slice(-6)}`;

    const batch = await prisma.$transaction(async (tx) => {
      const b = await tx.ticketBatch.create({
        data: {
          batchNumber,
          ticketTypeId,
          totalTickets,
          totalCostCents,
          maxPrizeBudgetCents,
          currency: ticketType.currency,
          countryCode: ticketType.countryCode,
          status: "ACTIVE",
          configSnapshotJson: JSON.stringify(tiers),
        },
      });

      for (const t of tiers) {
        await tx.prizeTierConfig.create({
          data: {
            batchId: b.id,
            tierName: t.tierName,
            prizeAmountCents: t.prizeAmountCents,
            probability: t.probability,
            allocatedCount: t.count,
            remainingCount: t.count,
            displayLabel: t.label,
            symbolsPattern: "[]",
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "PROBABILITY_CHANGED",
          resource: "TicketBatch",
          resourceId: b.id,
          details: JSON.stringify({ batchNumber, maxPrizeBudgetCents, totalTickets }),
        },
      });

      return b;
    });

    return NextResponse.json({ success: true, batch });
  } catch (error: any) {
    console.error("Erreur création lot:", error);
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 400 });
  }
}
