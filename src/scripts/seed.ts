import { runDatabaseSeed } from "../lib/seed";
import { prisma } from "../lib/prisma";

runDatabaseSeed()
  .catch((e) => {
    console.error("Erreur de seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
