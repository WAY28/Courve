import { HttpError } from "./asyncHandler";
import { prisma } from "./prisma";

const WHATSAPP_KEY = "whatsappNumber";

export async function getWhatsappNumber(): Promise<string> {
  const row = await prisma.setting.findUnique({ where: { key: WHATSAPP_KEY } });
  return row?.value ?? "";
}

/**
 * Accepts "0812-3456-7890", "+62 812 3456 7890" or "6281234567890" and returns
 * the international form wa.me expects (digits only, country code first).
 * An empty value clears the number.
 */
export function normalizeWhatsapp(input: string): string {
  // Only a truly empty value clears the number; "abc" must not wipe it.
  if (input.trim() === "") return "";
  const digits = input.replace(/\D/g, "");
  const intl = digits.startsWith("0") ? `62${digits.slice(1)}` : digits;
  if (!/^[1-9]\d{8,14}$/.test(intl)) {
    throw new HttpError("Nomor WhatsApp tidak valid. Contoh: 081234567890 atau 6281234567890.");
  }
  return intl;
}

export async function setWhatsappNumber(value: string) {
  await prisma.setting.upsert({
    where: { key: WHATSAPP_KEY },
    create: { key: WHATSAPP_KEY, value },
    update: { value },
  });
}
