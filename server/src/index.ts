import "dotenv/config";
import cors from "cors";
import express from "express";
import { adminRouter } from "./routes/admin";
import { adminAuthRouter } from "./routes/adminAuth";
import { authRouter } from "./routes/auth";
import { ordersRouter } from "./routes/orders";
import { productsRouter } from "./routes/products";
import { reviewsRouter } from "./routes/reviews";
import { settingsRouter } from "./routes/settings";
import { publicUploadRouter } from "./routes/uploads";
import { wishlistRouter } from "./routes/wishlist";
import { HttpError } from "./lib/asyncHandler";
import { prisma } from "./lib/prisma";

const app = express();
const PORT = Number(process.env.PORT ?? 4000);
const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:3000";

app.disable("x-powered-by");
// Behind a reverse proxy (Render, etc.) set TRUST_PROXY=1 so req.ip is the real client.
if (process.env.TRUST_PROXY) app.set("trust proxy", Number(process.env.TRUST_PROXY));
app.use((_req, res, next) => {
  res.set({
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    "Cache-Control": "no-store",
  });
  next();
});
// Content-Disposition must be exposed so the browser can read the CSV filename.
app.use(cors({ origin: FRONTEND_URL, exposedHeaders: ["Content-Disposition"] }));
app.use(express.json({ limit: "100kb" }));

// Light check for uptime pings: does not touch the database, so pinging it never
// keeps a scale-to-zero database (Neon) awake.
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Full check including the database.
app.get("/api/health/db", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok" });
  } catch {
    res.status(503).json({ status: "database-unavailable" });
  }
});

app.use("/api/auth", authRouter);
app.use("/api/admin/auth", adminAuthRouter);
app.use("/api/admin", adminRouter);
app.use("/api/uploads", publicUploadRouter);
app.use("/api/products", productsRouter);
app.use("/api/products", reviewsRouter);
app.use("/api/wishlist", wishlistRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/orders", ordersRouter);

app.use((_req, res) => {
  res.status(404).json({ error: "Route tidak ditemukan." });
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
  const type = (err as { type?: string })?.type;
  if (type === "entity.too.large") return res.status(413).json({ error: "File terlalu besar (maksimal 3 MB)." });
  if (type === "entity.parse.failed") return res.status(400).json({ error: "Format data tidak valid." });
  console.error(err);
  res.status(500).json({ error: "Terjadi kesalahan pada server." });
});

app.listen(PORT, () => {
  console.log(`Courve API berjalan di http://localhost:${PORT}`);
});
