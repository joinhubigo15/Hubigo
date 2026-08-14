import fs from "fs";
import path from "path";
import { prisma } from "../src/lib/prisma";

async function main() {
  const sqlPath = path.join(__dirname, "..", "prisma", "manual-sql", "001_search_trigram_indexes.sql");
  const sql = fs.readFileSync(sqlPath, "utf-8");
  const withoutComments = sql
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n");

  const statements = withoutComments
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const statement of statements) {
    console.log(`Running: ${statement.split("\n")[0]}...`);
    await prisma.$executeRawUnsafe(statement);
  }

  console.log(`Applied ${statements.length} statement(s).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
