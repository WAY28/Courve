// Starter catalogue shared by prisma/seed.ts (dev) and src/bootstrap.ts (production).
export const products = [
  {
    slug: "courve-floral-premium",
    name: "Piyama Set Courve Floral Premium",
    price: 259000,
    oldPrice: 299000,
    category: "Set Couple",
    sizes: ["S", "M", "L", "XL"],
    colorway: "Ivory Lavender",
    material: "Katun Premium",
    description:
      "Set piyama katun premium dengan bordir motif bunga eksklusif dan list lavender lembut. Dilengkapi kerah kemeja klasik, saku depan, dan tali celana serut yang nyaman dipakai sepanjang malam.",
    images: ["/images/products/courve-floral.jpg"],
    rating: 4.8,
    reviews: 32,
  },
  {
    slug: "couple-motif-gajah",
    name: "Set Piyama Couple Motif Gajah",
    price: 279000,
    oldPrice: null,
    category: "Set Couple",
    sizes: ["M", "L", "XL", "XXL"],
    colorway: "Hitam Putih",
    material: "Katun Rayon",
    description:
      "Set piyama couple lengan panjang dengan motif etnik gajah hitam putih yang khas. Nyaman dipakai berpasangan untuk momen santai di rumah.",
    images: ["/images/products/couple-gajah.jpg"],
    rating: 4.6,
    reviews: 18,
  },
  {
    slug: "couple-floral-abu",
    name: "Set Piyama Couple Motif Bunga Abu",
    price: 249000,
    oldPrice: null,
    category: "Set Couple",
    sizes: ["M", "L", "XL"],
    colorway: "Abu Floral",
    material: "Katun Jepang",
    description:
      "Set piyama couple bermotif bunga kecil warna abu yang kalem. Berbahan katun Jepang yang adem, ringan, dan nyaman untuk tidur maupun bersantai.",
    images: ["/images/products/couple-floral-abu.jpg"],
    rating: 4.7,
    reviews: 25,
  },
];
