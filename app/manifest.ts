import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Courve — Sleepwear Nyaman",
    short_name: "Courve",
    description:
      "Toko online piyama nyaman untuk tidur dan bersantai di rumah.",
    start_url: "/",
    display: "standalone",
    background_color: "#FAF7F2",
    theme_color: "#6F6389",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
