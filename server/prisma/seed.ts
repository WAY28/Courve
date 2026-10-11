import { PrismaClient } from "@prisma/client";
import "dotenv/config";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

import { products } from "../src/seedData";

async function main() {
  for (const p of products) {
    const { sizes, images, ...rest } = p;
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: { ...rest, imagesJson: JSON.stringify(images) },
      create: { ...rest, imagesJson: JSON.stringify(images), published: true },
    });
    // Stock is only set when a size is first created, so re-seeding never
    // overwrites stock the admin has already adjusted.
    for (const size of sizes) {
      await prisma.productSize.upsert({
        where: { productId_size: { productId: product.id, size } },
        update: {},
        create: { productId: product.id, size, stock: 20 },
      });
    }
  }

  // Akun demo untuk development saja. Menjalankan seed lagi mereset password-nya.
  // Password admin bisa diganti lewat SEED_ADMIN_PASSWORD di server/.env.
  await prisma.user.deleteMany({ where: { email: "admin@piyama.co" } });

  const demoAccounts = [
    {
      name: "Admin Courve",
      email: "admin@courve.co",
      password: process.env.SEED_ADMIN_PASSWORD ?? "Courve!Admin2026",
      role: "ADMIN",
    },
    { name: "Demo User", email: "user@courve.co", password: "user12345", role: "USER" },
  ];
  for (const acc of demoAccounts) {
    const passwordHash = await bcrypt.hash(acc.password, 10);
    await prisma.user.upsert({
      where: { email: acc.email },
      update: { passwordHash, role: acc.role, name: acc.name },
      create: { name: acc.name, email: acc.email, passwordHash, role: acc.role },
    });
  }

  console.log(`Seed selesai: ${products.length} produk, ${demoAccounts.length} akun demo.`);
  for (const acc of demoAccounts) {
    console.log(`${acc.role}: ${acc.email} / ${acc.password}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
