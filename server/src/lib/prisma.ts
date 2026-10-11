import { PrismaClient } from "@prisma/client";

// A hosted database is remote and may be waking from idle, so give interactive
// transactions (checkout, cancel) more room than Prisma's 2s wait / 5s run defaults.
export const prisma = new PrismaClient({ transactionOptions: { maxWait: 10_000, timeout: 20_000 } });
