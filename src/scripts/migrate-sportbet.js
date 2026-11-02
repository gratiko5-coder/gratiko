const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "SportBet" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "betTicketNumber" TEXT NOT NULL UNIQUE,
      "userId" TEXT NOT NULL,
      "sportKey" TEXT NOT NULL DEFAULT 'soccer',
      "matchId" TEXT NOT NULL,
      "leagueName" TEXT NOT NULL DEFAULT 'Football',
      "homeTeam" TEXT NOT NULL,
      "awayTeam" TEXT NOT NULL,
      "commenceTime" TIMESTAMP(3) NOT NULL,
      "marketType" TEXT NOT NULL DEFAULT 'h2h',
      "selectedOutcome" TEXT NOT NULL,
      "selectedLabel" TEXT NOT NULL,
      "odds" DOUBLE PRECISION NOT NULL,
      "stakeCents" INTEGER NOT NULL,
      "potentialWinCents" INTEGER NOT NULL,
      "currency" TEXT NOT NULL DEFAULT 'HTG',
      "countryCode" TEXT NOT NULL DEFAULT 'HT',
      "status" TEXT NOT NULL DEFAULT 'PENDING',
      "resultScore" TEXT,
      "settledAt" TIMESTAMP(3),
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "SportBet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "SportBet_userId_idx" ON "SportBet"("userId");
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "SportBet_status_idx" ON "SportBet"("status");
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "SportBet_matchId_idx" ON "SportBet"("matchId");
  `);

  console.log('✅ Table SportBet créée avec succès en base de données !');
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
