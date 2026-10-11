import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "./lib/prisma";
import { products } from "./seedData";

// Runs on every production start (see "start:prod"). It is idempotent:
//  - creates the first admin from ADMIN_EMAIL / ADMIN_PASSWORD only if no admin exists yet
//    (it never resets an existing password, and no demo accounts are ever created);
//  - loads the starter products only while the catalogue is empty.
async function main() {
  const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
  if (adminCount === 0) {
    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD;
    if (!email || !password) {
      console.warn("[bootstrap] Belum ada admin. Set ADMIN_EMAIL dan ADMIN_PASSWORD lalu deploy ulang.");
    } else if (password.length < 12) {
      throw new Error("ADMIN_PASSWORD minimal 12 karakter.");
    } else {
      await prisma.user.create({
        data: { name: "Admin Courve", email, passwordHash: await bcrypt.hash(password, 10), role: "ADMIN" },
      });
      console.log(`[bootstrap] Admin dibuat: ${email}. Hapus ADMIN_PASSWORD dari environment setelah login pertama.`);
    }
  }

  if (process.env.SEED_PRODUCTS !== "false" && (await prisma.product.count()) === 0) {
    for (const p of products) {
      const { sizes, images, ...rest } = p;
      await prisma.product.create({
        data: {
          ...rest,
          imagesJson: JSON.stringify(images),
          published: true,
          sizes: { create: sizes.map((size) => ({ size, stock: 20 })) },
        },
      });
    }
    console.log(`[bootstrap] ${products.length} produk contoh dimuat (stok 20 per ukuran, ubah di panel admin).`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
