import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { ensureStandardChartOfAccounts, recordBalancedTransaction, ACCOUNT_CODES } from "@/lib/finance";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2),
  phone: z.string().optional(),
  countryCode: z.string().default("HT"),
  preferredLocale: z.string().default("fr"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Champs invalides", details: parsed.error.format() }, { status: 400 });
    }

    const { email, password, fullName, phone, countryCode, preferredLocale } = parsed.data;

    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email }, ...(phone ? [{ phone }] : [])],
      },
    });

    if (existing) {
      return NextResponse.json({ error: "Un compte existe déjà avec cet email ou ce téléphone." }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);

    // Initialisation du marché et compte
    await ensureStandardChartOfAccounts(countryCode, "HTG");

    const isProd = process.env.APP_MODE === "PRODUCTION";
    const initialBonusCents = isProd ? 0 : 50000;

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName,
        phone,
        role: "PLAYER",
        countryCode,
        currency: "HTG",
        preferredLocale,
        isEmailVerified: false,
        isDemoAccount: !isProd,
        wallet: {
          create: {
            balanceCents: initialBonusCents,
            currency: "HTG",
          },
        },
      },
      include: { wallet: true },
    });

    // Enregistrer le bonus de bienvenue démo uniquement hors production
    if (!isProd && initialBonusCents > 0) {
      await recordBalancedTransaction({
        idempotencyKey: `WELCOME_BONUS_${user.id}`,
        reference: `BONUS-${user.id.slice(-6)}`,
        description: "Bonus de bienvenue de démonstration (Crédits fictifs)",
        transactionType: "RECHARGE_DEPOSIT",
        amountCents: initialBonusCents,
        currency: "HTG",
        countryCode,
        relatedEntityId: user.id,
        entries: [
          { accountCode: ACCOUNT_CODES.CASH_VAULT, entryType: "DEBIT", amountCents: initialBonusCents },
          { accountCode: ACCOUNT_CODES.PLAYER_BALANCES, entryType: "CREDIT", amountCents: initialBonusCents },
        ],
      });
    }

    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      countryCode: user.countryCode,
      preferredLocale: user.preferredLocale,
      isDemoAccount: user.isDemoAccount,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 3600,
    });

    return response;
  } catch (error: any) {
    console.error("Erreur register:", error);
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 });
  }
}
