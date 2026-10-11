import bcrypt from "bcryptjs";
import type { Request } from "express";
import { createLimiter } from "./rateLimit";
import { prisma } from "./prisma";

// Compared against when the email is unknown so response time does not reveal
// whether an account exists.
const DUMMY_HASH = bcrypt.hashSync("tidak-dipakai-untuk-login", 10);

/**
 * Returns the user only when email + password match AND the account has the
 * expected role. Wrong portal (admin on the customer login or vice versa)
 * looks exactly like a wrong password.
 */
export async function verifyCredentials(email: string, password: string, role: "USER" | "ADMIN") {
  const user = await prisma.user.findUnique({ where: { email } });
  const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !valid || user.role !== role) return null;
  return user;
}

const FIFTEEN_MINUTES = 15 * 60 * 1000;

/** Throttles repeated failed logins per account and per IP address. */
export function createLoginGuard(limits: { perAccount: number; perIp: number }) {
  const perAccount = createLimiter({ max: limits.perAccount, windowMs: FIFTEEN_MINUTES });
  const perIp = createLimiter({ max: limits.perIp, windowMs: FIFTEEN_MINUTES });
  const keys = (req: Request, email: string) => ({
    account: `${req.ip}|${email}`,
    ip: req.ip ?? "unknown",
  });

  return {
    /** Seconds the caller must wait, or 0 when allowed. */
    blockedFor(req: Request, email: string) {
      const k = keys(req, email);
      return Math.max(perAccount.blockedFor(k.account), perIp.blockedFor(k.ip));
    },
    fail(req: Request, email: string) {
      const k = keys(req, email);
      perAccount.hit(k.account);
      perIp.hit(k.ip);
    },
    success(req: Request, email: string) {
      perAccount.clear(keys(req, email).account);
    },
  };
}

export function tooManyAttemptsMessage(seconds: number) {
  const minutes = Math.max(1, Math.ceil(seconds / 60));
  return `Terlalu banyak percobaan gagal. Coba lagi dalam ${minutes} menit.`;
}
