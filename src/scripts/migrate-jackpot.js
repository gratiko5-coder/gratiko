const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log('Création de la table ProgressiveJackpot...');
  
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "ProgressiveJackpot" (
      "id" TEXT PRIMARY KEY,
      "name" TEXT NOT NULL,
      "currentAmountCents" BIGINT NOT NULL DEFAULT 0,
      "seedAmountCents" INTEGER NOT NULL DEFAULT 0,
      "contributionRate" DOUBLE PRECISION NOT NULL DEFAULT 0.005,
      "probability" DOUBLE PRECISION NOT NULL DEFAULT 0.0001,
      "lastWonAt" TIMESTAMP(3),
      "lastWinnerUserId" TEXT,
      "lastWonAmountCents" INTEGER,
      "totalPaidOutCents" BIGINT NOT NULL DEFAULT 0,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('✅ Table ProgressiveJackpot créée avec succès !');

  // Initialisation des 3 jackpots réels (Valeurs de la maquette : 6 565, 59 234, 20 744)
  const initialJackpots = [
    {
      id: 'SILVER',
      name: 'Silver Jackpot',
      currentAmountCents: 656500, // 6 565,00 HTG
      seedAmountCents: 500000,    // Base de reset 5 000 HTG
      contributionRate: 0.005,    // 0.5% de chaque mise
      probability: 0.002,         // ~ 1 chance sur 500
    },
    {
      id: 'GOLD',
      name: 'Gold Jackpot',
      currentAmountCents: 5923400, // 59 234,00 HTG
      seedAmountCents: 5000000,    // Base de reset 50 000 HTG
      contributionRate: 0.003,     // 0.3% de chaque mise
      probability: 0.0004,         // ~ 1 chance sur 2 500
    },
    {
      id: 'MAXIMUM',
      name: 'Maximum Jackpot',
      currentAmountCents: 2074400, // 20 744,00 HTG
      seedAmountCents: 2000000,    // Base de reset 20 000 HTG
      contributionRate: 0.002,     // 0.2% de chaque mise
      probability: 0.00008,        // ~ 1 chance sur 12 500
    },
  ];

  for (const j of initialJackpots) {
    await prisma.$executeRawUnsafe(`
      INSERT INTO "ProgressiveJackpot" ("id", "name", "currentAmountCents", "seedAmountCents", "contributionRate", "probability")
      VALUES ('${j.id}', '${j.name}', ${j.currentAmountCents}, ${j.seedAmountCents}, ${j.contributionRate}, ${j.probability})
      ON CONFLICT ("id") DO NOTHING;
    `);
    console.log(`✅ Jackpot ${j.id} initialisé !`);
  }
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
