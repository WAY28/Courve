import type { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { verifyToken, type AuthPayload } from "../lib/jwt";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

function authenticate(req: Request): AuthPayload | null {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  try {
    return verifyToken(header.slice("Bearer ".length));
  } catch {
    return null;
  }
}

/** Any valid token (user or admin). */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = authenticate(req);
  if (!user) return res.status(401).json({ error: "Token tidak ditemukan atau tidak valid." });
  req.user = user;
  next();
}

/** Customer tokens only: an admin token cannot act as a shopper. */
export async function requireUser(req: Request, res: Response, next: NextFunction) {
  try {
    const user = authenticate(req);
    if (!user) return res.status(401).json({ error: "Token tidak ditemukan atau tidak valid." });
    if (user.scope !== "user") return res.status(403).json({ error: "Akses ditolak." });
    const current = await prisma.user.findUnique({ where: { id: user.sub }, select: { active: true } });
    if (!current?.active) return res.status(403).json({ error: "Akun tidak aktif." });
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

/** Attaches the customer when a valid customer token is sent; everyone else is a guest. */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const user = authenticate(req);
    if (user?.scope === "user") {
      const current = await prisma.user.findUnique({ where: { id: user.sub }, select: { active: true } });
      if (current?.active) req.user = user;
    }
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Admin tokens only, and the role is re-checked against the database on every
 * request so that revoking an admin takes effect immediately.
 */
export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const user = authenticate(req);
    if (!user) return res.status(401).json({ error: "Token tidak ditemukan atau tidak valid." });
    if (user.scope !== "admin" || user.role !== "ADMIN") {
      return res.status(403).json({ error: "Akses khusus admin." });
    }
    const current = await prisma.user.findUnique({
      where: { id: user.sub },
      select: { role: true, active: true },
    });
    if (current?.role !== "ADMIN" || !current.active) return res.status(403).json({ error: "Akses khusus admin." });
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}
