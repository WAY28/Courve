import { Router } from "express";
import { ah } from "../lib/asyncHandler";
import { getWhatsappNumber } from "../lib/settings";

export const settingsRouter = Router();

// Public: the storefront needs the shop's WhatsApp number to build chat links.
settingsRouter.get(
  "/",
  ah(async (_req, res) => {
    res.set("Cache-Control", "no-store");
    res.json({ whatsappNumber: await getWhatsappNumber() });
  })
);
