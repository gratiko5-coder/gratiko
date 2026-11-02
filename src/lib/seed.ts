import { prisma } from "./prisma";
import { hashPassword } from "./auth";
import { ensureStandardChartOfAccounts, recordBalancedTransaction, ACCOUNT_CODES } from "./finance";

export async function runDatabaseSeed() {
  console.log("🌱 Démarrage de l'initialisation de la base de données GRATIKO...");

  // 1. Initialiser le plan comptable
  await ensureStandardChartOfAccounts("HT", "HTG");

  // 2. Créer le marché Haïti
  await prisma.countryMarket.upsert({
    where: { code: "HT" },
    update: { isMarketActive: true },
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
      complianceNotes: "Version de démonstration avec argent fictif. Nécessite accréditation officielle avant passage en production.",
    },
  });

  // 3. Types de tickets officiels (100, 250, 500, 1000 HTG)
  // Désactiver tout ancien ticket non standard (ex: 200)
  await prisma.ticketType.updateMany({
    where: { slug: { notIn: ["chans-lakay-100", "gwo-chans-250", "milyone-500", "jackpot-vip-1000"] } },
    data: { isActive: false },
  });

  const ticketTypes = [
    {
      slug: "chans-lakay-100",
      name: "Chans Lakay 100",
      description: "Le ticket classique populaire à 100 Gourdes. 3 symboles identiques pour gagner jusqu'à 3 000 Gourdes instantanément !",
      priceCents: 10000, // 100 HTG
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
      description: "Ticket dynamique à 250 Gourdes avec gains fréquents et super jackpot pouvant atteindre 15 000 Gourdes.",
      priceCents: 25000, // 250 HTG
      currency: "HTG",
      countryCode: "HT",
      visualTheme: "emerald-indigo",
      rulesText: "Découvrez 3 symboles identiques dans la grille pour décrocher votre gain instantané.",
      tiers: [
        { tierName: "PERDANT", prizeAmountCents: 0, probability: 0.72, count: 720, label: "Perdu", pattern: "[]" },
        { tierName: "GAIN_250", prizeAmountCents: 25000, probability: 0.15, count: 150, label: "250 HTG", pattern: "[]" },
        { tierName: "GAIN_500", prizeAmountCents: 50000, probability: 0.08, count: 80, label: "500 HTG", pattern: "[]" },
        { tierName: "GAIN_1500", prizeAmountCents: 150000, probability: 0.035, count: 35, label: "1 500 HTG", pattern: "[]" },
        { tierName: "JACKPOT_15000", prizeAmountCents: 1500000, probability: 0.015, count: 15, label: "15 000 HTG", pattern: "[]" },
      ],
    },
    {
      slug: "milyone-500",
      name: "Milyonè Kreyòl 500",
      description: "Ticket prestige à 500 Gourdes pour les passionnés avec cagnotte géante allant jusqu'à 50 000 Gourdes.",
      priceCents: 50000, // 500 HTG
      currency: "HTG",
      countryCode: "HT",
      visualTheme: "violet-purple",
      rulesText: "Grattez la surface métallisée et alignez 3 symboles gagnants pour remporter la cagnotte.",
      tiers: [
        { tierName: "PERDANT", prizeAmountCents: 0, probability: 0.75, count: 750, label: "Perdu", pattern: "[]" },
        { tierName: "GAIN_500", prizeAmountCents: 50000, probability: 0.14, count: 140, label: "500 HTG", pattern: "[]" },
        { tierName: "GAIN_1000", prizeAmountCents: 100000, probability: 0.07, count: 70, label: "1 000 HTG", pattern: "[]" },
        { tierName: "GAIN_3000", prizeAmountCents: 300000, probability: 0.025, count: 25, label: "3 000 HTG", pattern: "[]" },
        { tierName: "JACKPOT_50000", prizeAmountCents: 5000000, probability: 0.015, count: 15, label: "50 000 HTG", pattern: "[]" },
      ],
    },
    {
      slug: "jackpot-vip-1000",
      name: "Jackpot VIP 1 000",
      description: "Le sommet du jeu instantané à 1 000 Gourdes. Cotes exclusives et méga-jackpot sensationnel de 150 000 Gourdes !",
      priceCents: 100000, // 1 000 HTG
      currency: "HTG",
      countryCode: "HT",
      visualTheme: "gold-royal",
      rulesText: "Le ticket suprême : grattez les 9 cases pour révéler le méga-jackpot.",
      tiers: [
        { tierName: "PERDANT", prizeAmountCents: 0, probability: 0.78, count: 780, label: "Perdu", pattern: "[]" },
        { tierName: "GAIN_1000", prizeAmountCents: 100000, probability: 0.12, count: 120, label: "1 000 HTG", pattern: "[]" },
        { tierName: "GAIN_2500", prizeAmountCents: 250000, probability: 0.06, count: 60, label: "2 500 HTG", pattern: "[]" },
        { tierName: "GAIN_10000", prizeAmountCents: 1000000, probability: 0.025, count: 25, label: "10 000 HTG", pattern: "[]" },
        { tierName: "JACKPOT_150000", prizeAmountCents: 15000000, probability: 0.015, count: 15, label: "150 000 HTG", pattern: "[]" },
      ],
    },
  ];

  for (const t of ticketTypes) {
    const { tiers, ...ticketTypeData } = t;
    const createdType = await prisma.ticketType.upsert({
      where: { slug: t.slug },
      update: {
        name: t.name,
        description: t.description,
        priceCents: t.priceCents,
        isActive: true,
        rulesText: t.rulesText,
      },
      create: ticketTypeData,
    });

    // Créer un lot actif pour chaque type si aucun lot actif n'existe
    const existingBatch = await prisma.ticketBatch.findFirst({
      where: { ticketTypeId: createdType.id, status: "ACTIVE" },
    });

    if (!existingBatch) {
      const totalTickets = 1000;
      const totalCostCents = totalTickets * createdType.priceCents;
      const batchNumber = `BATCH-${createdType.slug.toUpperCase()}-001`;
      const prizeTiers = tiers;
      const maxPrizeBudgetCents = prizeTiers.reduce((sum, tier) => sum + tier.prizeAmountCents * tier.count, 0);

      const batch = await prisma.ticketBatch.create({
        data: {
          batchNumber,
          ticketTypeId: createdType.id,
          totalTickets,
          totalCostCents,
          maxPrizeBudgetCents,
          currency: createdType.currency,
          countryCode: createdType.countryCode,
          status: "ACTIVE",
          configSnapshotJson: JSON.stringify(prizeTiers),
        },
      });

      for (const tier of prizeTiers) {
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

  // 4. Utilisateurs de démonstration
  const adminPasswordHash = await hashPassword("GratikoAdmin2026!");
  const playerPasswordHash = await hashPassword("GratikoPlayer2026!");

  // Super Admin
  const superAdmin = await prisma.user.upsert({
    where: { email: "superadmin@gratiko.demo" },
    update: { role: "SUPER_ADMIN", isDemoAccount: true },
    create: {
      email: "superadmin@gratiko.demo",
      fullName: "Super Administrateur GRATIKO",
      passwordHash: adminPasswordHash,
      role: "SUPER_ADMIN",
      countryCode: "HT",
      currency: "HTG",
      preferredLocale: "fr",
      isEmailVerified: true,
      isDemoAccount: true,
      wallet: {
        create: {
          balanceCents: 0,
          currency: "HTG",
        },
      },
    },
  });

  // Country Admin Haïti
  await prisma.user.upsert({
    where: { email: "admin.haiti@gratiko.demo" },
    update: { role: "COUNTRY_ADMIN", isDemoAccount: true },
    create: {
      email: "admin.haiti@gratiko.demo",
      fullName: "Directeur Opérations Haïti",
      passwordHash: adminPasswordHash,
      role: "COUNTRY_ADMIN",
      countryCode: "HT",
      currency: "HTG",
      preferredLocale: "ht",
      isEmailVerified: true,
      isDemoAccount: true,
      wallet: {
        create: {
          balanceCents: 0,
          currency: "HTG",
        },
      },
    },
  });

  // Joueur de démonstration (avec 1 000 HTG de crédits fictifs offerts)
  const player = await prisma.user.upsert({
    where: { email: "joueur@gratiko.demo" },
    update: { isDemoAccount: true },
    create: {
      email: "joueur@gratiko.demo",
      fullName: "Jean-Pierre Démo",
      phone: "+509 37 12 34 56",
      passwordHash: playerPasswordHash,
      role: "PLAYER",
      countryCode: "HT",
      currency: "HTG",
      preferredLocale: "fr",
      isEmailVerified: true,
      isDemoAccount: true,
      wallet: {
        create: {
          balanceCents: 100000, // 1 000.00 HTG
          currency: "HTG",
        },
      },
    },
    include: { wallet: true },
  });

  // Écriture initiale au grand livre pour les fonds fictifs du joueur de test
  await recordBalancedTransaction({
    idempotencyKey: `INITIAL_DEMO_CREDIT_${player.id}`,
    reference: "DEMO-INIT-001",
    description: "Crédit initial de démonstration (Fonds d'essai sandbox)",
    transactionType: "RECHARGE_DEPOSIT",
    amountCents: 100000,
    currency: "HTG",
    countryCode: "HT",
    relatedEntityId: player.id,
    entries: [
      { accountCode: ACCOUNT_CODES.CASH_VAULT, entryType: "DEBIT", amountCents: 100000 },
      { accountCode: ACCOUNT_CODES.PLAYER_BALANCES, entryType: "CREDIT", amountCents: 100000 },
    ],
  });

  console.log("✅ Base de données GRATIKO initialisée avec succès !");
  console.log("Comptes de test disponibles :");
  console.log(" - Super Administrateur : superadmin@gratiko.demo (MDP: GratikoAdmin2026!)");
  console.log(" - Admin Pays Haïti     : admin.haiti@gratiko.demo (MDP: GratikoAdmin2026!)");
  console.log(" - Joueur Démo          : joueur@gratiko.demo (MDP: GratikoPlayer2026! | Solde: 1 000 HTG)");
}
