import express, { Router } from "express";
import { ah, HttpError } from "../lib/asyncHandler";
import { prisma } from "../lib/prisma";
import { requireAdmin } from "../middleware/auth";

const MAX_BYTES = 3 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

// Never trust the Content-Type header alone: check the file's real signature.
function detectMime(buf: Buffer): string | null {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return "image/png";
  }
  if (buf.length > 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") {
    return "image/webp";
  }
  return null;
}

/** Admin-only upload: the raw image bytes are the request body. */
export const adminUploadRouter = Router();

adminUploadRouter.post(
  "/",
  requireAdmin,
  express.raw({ type: ALLOWED, limit: MAX_BYTES }),
  ah(async (req, res) => {
    if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
      throw new HttpError("Gunakan file gambar JPG, PNG, atau WebP (maksimal 3 MB).", 415);
    }
    const mime = detectMime(req.body);
    if (!mime) throw new HttpError("Isi file bukan gambar JPG, PNG, atau WebP yang valid.", 415);

    const upload = await prisma.upload.create({
      data: { mime, size: req.body.length, data: Uint8Array.from(req.body) },
      select: { id: true },
    });
    res.status(201).json({ id: upload.id, url: `/uploads/${upload.id}` });
  })
);

/** Public read of an uploaded image. Ids are unguessable and immutable. */
export const publicUploadRouter = Router();

publicUploadRouter.get(
  "/:id",
  ah(async (req, res) => {
    const upload = await prisma.upload.findUnique({ where: { id: req.params.id } });
    if (!upload) return res.status(404).json({ error: "Gambar tidak ditemukan." });
    res.set({
      "Content-Type": upload.mime,
      "Content-Length": String(upload.size),
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Disposition": "inline",
    });
    res.send(Buffer.from(upload.data));
  })
);

/** Removes uploaded images that no product references any more. */
export async function deleteUnreferencedUploads(urls: string[]) {
  const ids = urls.filter((u) => u.startsWith("/uploads/")).map((u) => u.slice("/uploads/".length));
  for (const id of ids) {
    const stillUsed = await prisma.product.count({ where: { imagesJson: { contains: `/uploads/${id}` } } });
    if (stillUsed === 0) await prisma.upload.deleteMany({ where: { id } });
  }
}
