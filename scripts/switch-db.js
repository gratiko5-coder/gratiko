const fs = require("fs");
const path = require("path");

const target = process.argv[2] || "postgresql";
const schemaPath = path.resolve(__dirname, "../prisma/schema.prisma");

let schema = fs.readFileSync(schemaPath, "utf-8");

if (target === "postgresql") {
  schema = schema.replace(
    /datasource db \{[\s\S]*?\}/,
    `datasource db {\n  provider  = "postgresql"\n  url       = env("DATABASE_URL")\n  directUrl = env("DIRECT_URL")\n}`
  );
  console.log("✅ Prisma configuré pour PostgreSQL / Supabase (avec pooler et directUrl) !");
} else if (target === "sqlite") {
  schema = schema.replace(
    /datasource db \{[\s\S]*?\}/,
    `datasource db {\n  provider = "sqlite"\n  url      = env("DATABASE_URL")\n}`
  );
  console.log("✅ Prisma configuré pour SQLite local !");
} else {
  console.error("Format inconnu : utilisez 'postgresql' ou 'sqlite'");
  process.exit(1);
}

fs.writeFileSync(schemaPath, schema, "utf-8");
