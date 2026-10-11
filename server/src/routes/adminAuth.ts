import { Router } from "express";
import { z } from "zod";
import { signToken } from "../lib/jwt";
import { createLoginGuard, tooManyAttemptsMessage, verifyCredentials } from "../lib/credentials";
import { prisma } from "../lib/prisma";
import { requireAdmin } from "../middleware/auth";

export const adminAuthRouter = Router();

// Stricter than the customer login: admins are a higher-value target.
const loginGuard = createLoginGuard({ perAccount: 5, perIp: 15 });

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(128),
});

adminAuthRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Email atau password tidak valid." });
  }
  const { email, password } = parsed.data;

  const wait = loginGuard.blockedFor(req, email);
  if (wait > 0) {
    res.set("Retry-After", String(wait));
    return res.status(429).json({ error: tooManyAttemptsMessage(wait) });
  }

  const admin = await verifyCredentials(email, password, "ADMIN");
  if (!admin || !admin.active) {
    loginGuard.fail(req, email);
    return res.status(401).json({ error: "Email atau password salah." });
  }
  loginGuard.success(req, email);

  const token = signToken({ sub: admin.id, email: admin.email, role: admin.role, scope: "admin" });
  res.json({
    token,
    user: { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
  });
});

// Lets the admin panel confirm that its session is still valid (role is
// re-checked against the database).
adminAuthRouter.get("/me", requireAdmin, async (req, res) => {
  const admin = await prisma.user.findUnique({ where: { id: req.user!.sub } });
  if (!admin) return res.status(404).json({ error: "Admin tidak ditemukan." });
  res.json({ id: admin.id, name: admin.name, email: admin.email, role: admin.role });
});
