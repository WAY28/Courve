import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { signToken } from "../lib/jwt";
import { createLoginGuard, tooManyAttemptsMessage, verifyCredentials } from "../lib/credentials";
import { createLimiter } from "../lib/rateLimit";
import { requireAuth, requireUser } from "../middleware/auth";

export const authRouter = Router();

const email = z.string().trim().toLowerCase().email().max(254);
const loginGuard = createLoginGuard({ perAccount: 5, perIp: 30 });
const registerLimiter = createLimiter({ max: 10, windowMs: 60 * 60 * 1000 });

const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email,
  password: z.string().min(8, "Password minimal 8 karakter.").max(128),
});

// Public registration can only ever create customer accounts.
authRouter.post("/register", async (req, res) => {
  const ip = req.ip ?? "unknown";
  const wait = registerLimiter.blockedFor(ip);
  if (wait > 0) {
    res.set("Retry-After", String(wait));
    return res.status(429).json({ error: "Terlalu banyak pendaftaran. Coba lagi nanti." });
  }

  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  registerLimiter.hit(ip);
  const { name, email: userEmail, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: userEmail } });
  if (existing) {
    return res.status(409).json({ error: "Email sudah terdaftar." });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email: userEmail, passwordHash, role: "USER" },
  });

  const token = signToken({ sub: user.id, email: user.email, role: user.role, scope: "user" });
  res.status(201).json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

const loginSchema = z.object({
  email,
  password: z.string().min(1).max(128),
});

// Customer login. Admin accounts are deliberately rejected here: they sign in
// through /api/admin/auth/login only.
authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Email atau password tidak valid." });
  }
  const { email: userEmail, password } = parsed.data;

  const wait = loginGuard.blockedFor(req, userEmail);
  if (wait > 0) {
    res.set("Retry-After", String(wait));
    return res.status(429).json({ error: tooManyAttemptsMessage(wait) });
  }

  const user = await verifyCredentials(userEmail, password, "USER");
  if (!user) {
    loginGuard.fail(req, userEmail);
    return res.status(401).json({ error: "Email atau password salah." });
  }
  loginGuard.success(req, userEmail);
  if (!user.active) {
    return res.status(403).json({ error: "Akun dinonaktifkan. Hubungi admin toko." });
  }

  const token = signToken({ sub: user.id, email: user.email, role: user.role, scope: "user" });
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.sub } });
  if (!user) return res.status(404).json({ error: "User tidak ditemukan." });
  res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
});

const profileSchema = z.object({ name: z.string().trim().min(2, "Nama minimal 2 karakter.").max(100) });

authRouter.patch("/me", requireUser, async (req, res) => {
  const parsed = profileSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const user = await prisma.user.update({ where: { id: req.user!.sub }, data: { name: parsed.data.name } });
  res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
});

const passwordLimiter = createLimiter({ max: 10, windowMs: 15 * 60 * 1000 });
const passwordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: z.string().min(8, "Password baru minimal 8 karakter.").max(128),
});

authRouter.post("/password", requireUser, async (req, res) => {
  const key = `u${req.user!.sub}`;
  const wait = passwordLimiter.blockedFor(key);
  if (wait > 0) {
    res.set("Retry-After", String(wait));
    return res.status(429).json({ error: "Terlalu banyak percobaan. Coba lagi nanti." });
  }
  const parsed = passwordSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  passwordLimiter.hit(key);

  const user = await prisma.user.findUnique({ where: { id: req.user!.sub } });
  if (!user || !(await bcrypt.compare(parsed.data.currentPassword, user.passwordHash))) {
    return res.status(400).json({ error: "Password saat ini salah." });
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(parsed.data.newPassword, 10) },
  });
  passwordLimiter.clear(key);
  res.json({ ok: true });
});
