// Produces prisma/schema.postgres.prisma from schema.prisma (SQLite, used locally)
// by switching the datasource provider, so there is a single source of truth.
import { readFileSync, writeFileSync } from "node:fs";

const source = readFileSync(new URL("../prisma/schema.prisma", import.meta.url), "utf8");
if (!source.includes('provider = "sqlite"')) throw new Error('schema.prisma: provider "sqlite" tidak ditemukan.');
const out = source.replace('provider = "sqlite"', 'provider = "postgresql"');
writeFileSync(new URL("../prisma/schema.postgres.prisma", import.meta.url), out);
console.log("prisma/schema.postgres.prisma dibuat.");
