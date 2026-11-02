import { prisma } from "../lib/prisma";

export async function seedNewGames() {
  console.log("🎮 Ajout des nouveaux tickets à gratter dans GRATIKO...");

  const newTicketTypes = [
    {
      slug: "ti-chans-50",
      name: "Ti Chans 50",
      description: "Le mini-ticket populaire accessible à tous pour seulement 50 Gourdes. 3 symboles identiques pour remporter jusqu'à 1 500 Gourdes !",
      priceCents: 5000,
      currency: "HTG",
      countryCode: "HT",
      visualTheme: "amber-gold",
      rulesText: "Grattez les 9 cases de la grille. Si 3 symboles identiques apparaissent, vous remportez le montant associé immédiatement.",
      tiers: [
        { tierName: "PERDANT", prizeAmountCents: 0, probability: 0.70, count: 700, label: "Perdu", pattern: "[]" },
        { tierName: "GAIN_50", prizeAmountCents: 5000, probability: 0.18, count: 180, label: "50 HTG", pattern: "[]" },
        { tierName: "GAIN_100", prizeAmountCents: 10000, probability: 0.08, count: 80, label: "100 HTG", pattern: "[]" },
        { tierName: "GAIN_250", prizeAmountCents: 25000, probability: 0.02, count: 20, label: "250 HTG", pattern: "[]" },
        { tierName: "JACKPOT_1500", prizeAmountCents: 150000, probability: 0.02, count: 20, label: "1 500 HTG", pattern: "[]" },
      ],
    },
    {
      slug: "bingo-lakay-150",
      name: "Bingo Lakay 150",
      description: "L'ambiance festive du Bingo traditionnel haïtien. Grattez vos numéros fétiches pour décrocher jusqu'à 7 500 Gourdes !",
      priceCents: 15000,
      currency: "HTG",
      countryCode: "HT",
      visualTheme: "indigo-violet",
      rulesText: "Grattez vos numéros d'or. Révélez les symboles de bingo pour empocher le gros lot.",
      tiers: [
        { tierName: "PERDANT", prizeAmountCents: 0, probability: 0.72, count: 720, label: "Perdu", pattern: "[]" },
        { tierName: "GAIN_150", prizeAmountCents: 15000, probability: 0.15, count: 150, label: "150 HTG", pattern: "[]" },
        { tierName: "GAIN_300", prizeAmountCents: 30000, probability: 0.08, count: 80, label: "300 HTG", pattern: "[]" },
        { tierName: "GAIN_1000", prizeAmountCents: 100000, probability: 0.03, count: 30, label: "1 000 HTG", pattern: "[]" },
        { tierName: "JACKPOT_7500", prizeAmountCents: 750000, probability: 0.02, count: 20, label: "7 500 HTG", pattern: "[]" },
      ],
    },
    {
      slug: "lucky-7-chan",
      name: "7 Chans Lucky 200",
      description: "Le chiffre porte-bonheur légendaire ! Découvrez les 7 d'or dans votre grille pour multiplier votre mise et remporter jusqu'à 10 000 Gourdes !",
      priceCents: 20000,
      currency: "HTG",
      countryCode: "HT",
      visualTheme: "crimson-gold",
      rulesText: "Grattez la grille. Chaque combinaison de 7 ou 3 symboles chanceux débloque un gain instantané.",
      tiers: [
        { tierName: "PERDANT", prizeAmountCents: 0, probability: 0.71, count: 710, label: "Perdu", pattern: "[]" },
        { tierName: "GAIN_200", prizeAmountCents: 20000, probability: 0.16, count: 160, label: "200 HTG", pattern: "[]" },
        { tierName: "GAIN_400", prizeAmountCents: 40000, probability: 0.08, count: 80, label: "400 HTG", pattern: "[]" },
        { tierName: "GAIN_1500", prizeAmountCents: 150000, probability: 0.03, count: 30, label: "1 500 HTG", pattern: "[]" },
        { tierName: "JACKPOT_10000", prizeAmountCents: 1000000, probability: 0.02, count: 20, label: "10 000 HTG", pattern: "[]" },
      ],
    },
    {
      slug: "tresor-caraibes-300",
      name: "Trésor des Caraïbes 300",
      description: "Partez à la conquête des coffres au trésor des Caraïbes ! Grattez et découvrez des coffres d'or et des multiplicateurs allant jusqu'à 25 000 Gourdes !",
      priceCents: 30000,
      currency: "HTG",
      countryCode: "HT",
      visualTheme: "teal-cyan",
      rulesText: "Ouvrez les 9 coffres au trésor. 3 coffres scintillants déclenchent le trésor immédiat.",
      tiers: [
        { tierName: "PERDANT", prizeAmountCents: 0, probability: 0.74, count: 740, label: "Perdu", pattern: "[]" },
        { tierName: "GAIN_300", prizeAmountCents: 30000, probability: 0.15, count: 150, label: "300 HTG", pattern: "[]" },
        { tierName: "GAIN_600", prizeAmountCents: 60000, probability: 0.06, count: 60, label: "600 HTG", pattern: "[]" },
        { tierName: "GAIN_2500", prizeAmountCents: 250000, probability: 0.03, count: 30, label: "2 500 HTG", pattern: "[]" },
        { tierName: "JACKPOT_25000", prizeAmountCents: 2500000, probability: 0.02, count: 20, label: "25 000 HTG", pattern: "[]" },
      ],
    },
  ];

  for (const tDef of newTicketTypes) {
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
      console.log(`✅ Ticket créé avec succès: ${ticketType.name} (${ticketType.priceCents / 100} HTG)`);
    } else {
      console.log(`ℹ️ Ticket existant déjà actif: ${ticketType.name}`);
    }
  }

  console.log("🎉 Tous les nouveaux tickets ont été ajoutés !");
}

seedNewGames()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
