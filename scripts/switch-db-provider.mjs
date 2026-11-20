import fs from "node:fs";
import path from "node:path";

const target = process.argv[2];
if (target !== "sqlite" && target !== "postgresql") {
  console.error("Kullanim: node scripts/switch-db-provider.mjs <sqlite|postgresql>");
  process.exit(1);
}

const schemaPath = path.resolve(process.cwd(), "prisma", "schema.prisma");
const content = fs.readFileSync(schemaPath, "utf8");
const updated = content.replace(
  /provider\s*=\s*"(sqlite|postgresql)"/,
  `provider = "${target}"`,
);
fs.writeFileSync(schemaPath, updated, "utf8");
console.log(`Prisma datasource provider '${target}' olarak guncellendi.`);
