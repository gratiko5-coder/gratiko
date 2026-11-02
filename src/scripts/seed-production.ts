import { prisma } from "../lib/prisma";
import { hashPassword } from "../lib/auth";
import { ensureStandardChartOfAccounts } from "../lib/finance";

export async function runProductionSeed() {
  console.log("🚀 Initialisation de l'environnement de PRODUCTION GRATIKO...");

  // 1. Initialiser le plan comptable officiel
  await ensureStandardChartOfAccounts("HT", "HTG");

  // 2. Initialiser le marché officiel Haïti
  await prisma.countryMarket.upsert({
    where: { code: "HT" },
    update: {
      isMarketActive: true,
      complianceNotes: "Plateforme officielle de tickets virtuels à gratter GRATIKO - Marché Haïti (HTG).",
    },
    create: {
      code: "HT",
      name: "Haïti",
      currency: "HTG",
      timezone: "America/Port-au-Prince",
      allowedLocales: JSON.stringify(["ht", "fr", "en"]),
      isMarketActive: true,
      minRechargeCents: 10000, // 100 HTG
      maxRechargeCents: 10000000, // 100 000 HTG
      minWithdrawalCents: 20000, // 200 HTG
      maxWithdrawalCents: 5000000, // 50 000 HTG
      operatorCommissionRatio: 0.20,
      gameAllocationRatio: 0.80,
      dailyReserveRatio: 0.40,
      complianceNotes: "Plateforme officielle de tickets virtuels à gratter GRATIKO - Marché Haïti (HTG).",
    },
  });

  // 3. Modèles de tickets officiels (100, 250, 500, 1000 HTG)
  const ticketTypes = [
    {
      slug: "chans-lakay-100",
      name: "Chans Lakay 100",
      description: "Le ticket classique populaire à 100 Gourdes. 3 symboles identiques pour gagner jusqu'à 3 000 Gourdes instantanément !",
      priceCents: 10000,
      currency: "HTG",
      countryCode: "HT",
      visualTheme: "gold-amber",
      rulesText: "Grattez les 9 cases de la grille. Si 3 symboles identiques apparaissent, vous remportez le lot correspondant.",
      tiers: [
        { tierName: "PERDANT", prizeAmountCents: 0, probability: 0.70, count: 700, label: "Perdu", pattern: "[]" },
        { tierName: "GAIN_100", prizeAmountCents: 10000, probability: 0.18, count: 180, label: "100 HTG", pattern: "[]" },
        { tierName: "GAIN_200", prizeAmountCents: 20000, probability: 0.08, count: 80, label: "200 HTG", pattern: "[]" },
        { tierName: "GAIN_500", prizeAmountCents: 50000, probability: 0.02, count: 20, label: "500 HTG", pattern: "[]" },
        { tierName: "JACKPOT_3000", prizeAmountCents: 300000, probability: 0.02, count: 20, label: "3 000 HTG", pattern: "[]" },
      ],
    },
    {
      slug: "gwo-chans-250",
      name: "Gwo Chans 250",
      description: "Ticket intermédiaire à 250 Gourdes. Taux de redistribution bonifié et cagnotte de palier jusqu'à 15 000 Gourdes !",
      priceCents: 25000,
      currency: "HTG",
      countryCode: "HT",
      visualTheme: "emerald-mint",
      rulesText: "Révélez la grille de 9 symboles. 3 symboles de richesse identiques déclenchent le gain instantané.",
      tiers: [
        { tierName: "PERDANT", prizeAmountCents: 0, probability: 0.65, count: 650, label: "Perdu", pattern: "[]" },
        { tierName: "GAIN_250", prizeAmountCents: 25000, probability: 0.20, count: 200, label: "250 HTG", pattern: "[]" },
        { tierName: "GAIN_500", prizeAmountCents: 50000, probability: 0.10, count: 100, label: "500 HTG", pattern: "[]" },
        { tierName: "GAIN_2000", prizeAmountCents: 200000, probability: 0.04, count: 40, label: "2 000 HTG", pattern: "[]" },
        { tierName: "JACKPOT_15000", prizeAmountCents: 1500000, probability: 0.01, count: 10, label: "15 000 HTG", pattern: "[]" },
      ],
    },
    {
      slug: "milyone-500",
      name: "Milyonè Kreyòl 500",
      description: "Le ticket Premium à 500 Gourdes. Forte volatilité pour les gros gagnants : jusqu'à 50 000 Gourdes de jackpot !",
      priceCents: 50000,
      currency: "HTG",
      countryCode: "HT",
      visualTheme: "ruby-crimson",
      rulesText: "Grattez la zone dorée. Les étoiles et coffres au trésor identiques multiplient vos récompenses.",
      tiers: [
        { tierName: "PERDANT", prizeAmountCents: 0, probability: 0.60, count: 600, label: "Perdu", pattern: "[]" },
        { tierName: "GAIN_500", prizeAmountCents: 50000, probability: 0.22, count: 220, label: "500 HTG", pattern: "[]" },
        { tierName: "GAIN_1000", prizeAmountCents: 100000, probability: 0.12, count: 120, label: "1 000 HTG", pattern: "[]" },
        { tierName: "GAIN_5000", prizeAmountCents: 500000, probability: 0.05, count: 50, label: "5 000 HTG", pattern: "[]" },
        { tierName: "JACKPOT_50000", prizeAmountCents: 5000000, probability: 0.01, count: 10, label: "50 000 HTG", pattern: "[]" },
      ],
    },
    {
      slug: "jackpot-vip-1000",
      name: "Jackpot VIP 1 000",
      description: "Le sommet du jeu instantané à 1 000 Gourdes. Super cagnotte évolutive avec gain maximal de 100 000 Gourdes !",
      priceCents: 100000,
      currency: "HTG",
      countryCode: "HT",
      visualTheme: "sapphire-neon",
      rulesText: "La grille VIP suprême. 3 couronnes ou 3 diamants débloquent le jackpot maximal de la réserve.",
      tiers: [
        { tierName: "PERDANT", prizeAmountCents: 0, probability: 0.55, count: 550, label: "Perdu", pattern: "[]" },
        { tierName: "GAIN_1000", prizeAmountCents: 100000, probability: 0.25, count: 250, label: "1 000 HTG", pattern: "[]" },
        { tierName: "GAIN_2500", prizeAmountCents: 250000, probability: 0.12, count: 120, label: "2 500 HTG", pattern: "[]" },
        { tierName: "GAIN_10000", prizeAmountCents: 1000000, probability: 0.06, count: 60, label: "10 000 HTG", pattern: "[]" },
        { tierName: "JACKPOT_100000", prizeAmountCents: 10000000, probability: 0.02, count: 20, label: "100 000 HTG", pattern: "[]" },
      ],
    },
  ];

  for (const tDef of ticketTypes) {
    const { tiers, ...ticketData } = tDef;
    const ticketType = await prisma.ticketType.upsert({
      where: { slug: tDef.slug },
      update: { ...ticketData, isActive: true },
      create: { ...ticketData, isActive: true },
    });

    const activeBatch = await prisma.ticketBatch.findFirst({
      where: { ticketTypeId: ticketType.id, status: "ACTIVE" },
    });

    if (!activeBatch) {
      const totalTickets = 1000;
      const totalCostCents = totalTickets * ticketType.priceCents;
      const batchNumber = `PROD-${ticketType.slug.toUpperCase()}-001`;
      const maxPrizeBudgetCents = tiers.reduce((sum, tier) => sum + tier.prizeAmountCents * tier.count, 0);

      const batch = await prisma.ticketBatch.create({
        data: {
          batchNumber,
          ticketTypeId: ticketType.id,
          totalTickets,
          totalCostCents,
          maxPrizeBudgetCents,
          currency: ticketType.currency,
          countryCode: ticketType.countryCode,
          status: "ACTIVE",
          configSnapshotJson: JSON.stringify(tiers),
        },
      });

      for (const tier of tiers) {
        await prisma.prizeTierConfig.create({
          data: {
            batchId: batch.id,
            tierName: tier.tierName,
            prizeAmountCents: tier.prizeAmountCents,
            probability: tier.probability,
            allocatedCount: tier.count,
            remainingCount: tier.count,
            displayLabel: tier.label,
            symbolsPattern: tier.pattern,
          },
        });
      }
    }
  }

  // 4. Nettoyage des données démo simulées
  console.log("🧹 Suppression des comptes et transactions de test simulés...");
  const demoUsers = await prisma.user.findMany({
    where: {
      OR: [
        { email: { endsWith: "@gratiko.demo" } },
        { isDemoAccount: true },
      ],
    },
  });

  for (const du of demoUsers) {
    // Supprimer les notifications, logs, tickets et demandes de cet utilisateur
    await prisma.notification.deleteMany({ where: { userId: du.id } });
    await prisma.auditLog.deleteMany({ where: { userId: du.id } });
    await prisma.ticket.deleteMany({ where: { userId: du.id } });
    await prisma.rechargeRequest.deleteMany({ where: { userId: du.id } });
    await prisma.withdrawalRequest.deleteMany({ where: { userId: du.id } });
    await prisma.wallet.deleteMany({ where: { userId: du.id } });
    await prisma.user.delete({ where: { id: du.id } });
  }

  // Nettoyer les écritures de simulation du grand livre
  await prisma.ledgerEntry.deleteMany({
    where: {
      transaction: {
        reference: { in: ["DEMO-INIT-001", "E2E_BUY", "TEST"] },
      },
    },
  });
  await prisma.ledgerTransaction.deleteMany({
    where: {
      reference: { in: ["DEMO-INIT-001", "E2E_BUY", "TEST"] },
    },
  });

  // 5. Créer le compte Super-Administrateur Officiel de Production
  const adminEmail = process.env.INITIAL_SUPERADMIN_EMAIL || "direction@gratiko.com";
  const adminPassword = process.env.INITIAL_SUPERADMIN_PASSWORD || "GratikoAdmin2026!";
  const adminPasswordHash = await hashPassword(adminPassword);

  const officialAdmin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      role: "SUPER_ADMIN",
      isDemoAccount: false,
    },
    create: {
      email: adminEmail,
      fullName: "Super Administrateur GRATIKO",
      passwordHash: adminPasswordHash,
      role: "SUPER_ADMIN",
      countryCode: "HT",
      currency: "HTG",
      preferredLocale: "fr",
      isEmailVerified: true,
      isDemoAccount: false,
      wallet: {
        create: {
          balanceCents: 0,
          currency: "HTG",
        },
      },
    },
  });

  console.log("✅ Plateforme GRATIKO initialisée en mode PRODUCTION officiel !");
  console.log(`Compte Super-Administrateur de production configuré :`);
  console.log(` - Email : ${officialAdmin.email}`);
  console.log(` - Accès sécurisé : /admin`);
}

runProductionSeed()
  .catch((e) => {
    console.error("Erreur d'initialisation production:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
