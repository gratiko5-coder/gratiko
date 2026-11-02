const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  for (let i = 0; i < 5; i++) {
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "SportBet" ADD COLUMN IF NOT EXISTS "betType" TEXT NOT NULL DEFAULT 'SIMPLE';
      `);
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "SportBet" ADD COLUMN IF NOT EXISTS "selectionsJson" TEXT;
      `);
      console.log('✅ Colonnes betType et selectionsJson ajoutées avec succès !');
      return;
    } catch (e) {
      console.log(`Tentative ${i+1} échouée, réessai...`, e.message);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
